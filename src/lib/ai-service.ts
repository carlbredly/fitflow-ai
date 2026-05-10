import { analyzeFoodImage, chatWithCoach, generateWorkoutPlan } from "@/lib/deepseek";

export interface OnboardingData {
  name: string;
  sex: "m" | "f";
  age: number;
  weight: number;
  height: number;
  goalWeight: number;
  dietConstraints: string[];
  goal: "gain" | "loss" | "maintain";
  mode: "normal" | "strict" | "extreme";
  weeks: number;
  equipment: string[];
}

export interface GeneratedPlan {
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  coachSummary: string;
  weeklyChange: number;
  sessionsPerWeek: number;
  sessions: Array<{
    day_index: number;
    session_name: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: number;
    }>;
  }>;
}

const API_URL = "https://api.deepseek.com/v1/chat/completions";

function sanitizeData(data: OnboardingData) {
  return {
    ...data,
    age: Math.max(15, Math.min(data.age, 80)),
    weight: Math.max(35, Math.min(data.weight, 300)),
    height: Math.max(120, Math.min(data.height, 250)),
    goalWeight: Math.max(35, Math.min(data.goalWeight, 300)),
    weeks: Math.max(1, Math.min(data.weeks, 52)),
  };
}

function calculateBMR(data: OnboardingData) {
  const base =
    10 * data.weight +
    6.25 * data.height -
    5 * data.age;

  return data.sex === "m"
    ? base + 5
    : base - 161;
}

function safeJSONParse(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No valid JSON returned");
    }

    return JSON.parse(match[0]);
  }
}

function validatePlan(plan: GeneratedPlan) {
  if (!plan.macros) {
    throw new Error("Missing macros");
  }

  if (
    plan.macros.kcal < 1000 ||
    plan.macros.kcal > 7000
  ) {
    throw new Error("Invalid calories");
  }

  if (!Array.isArray(plan.sessions)) {
    throw new Error("Invalid sessions");
  }

  return plan;
}

export async function generatePlan(
  rawData: OnboardingData,
): Promise<GeneratedPlan> {
  const data = sanitizeData(rawData);

  const bmr = calculateBMR(data);

  const systemPrompt = `
You are an ELITE fitness coach, nutrition scientist,
and evidence-based bodybuilding expert.

Your job:
- Generate SAFE fitness plans
- Generate scientifically valid macros
- Adapt training based on available equipment
- Avoid dangerous calorie deficits
- Avoid unrealistic programs
- Prioritize sustainability and adherence

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No explanations outside JSON
- Calories must remain realistic
- Protein:
  - fat loss = 2.2g/kg
  - muscle gain = 1.8-2.2g/kg
- Fat minimum = 0.8g/kg
- Training split must match experience level
- Beginners: full body / upper lower
- Intermediate: push pull legs possible
- Advanced: higher volume acceptable
- Respect recovery days
- Avoid duplicate exercises
- Use progressive overload principles

JSON FORMAT:
{
  "macros": {
    "kcal": number,
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "coachSummary": string,
  "weeklyChange": number,
  "sessionsPerWeek": number,
  "sessions": [
    {
      "day_index": number,
      "session_name": string,
      "exercises": [
        {
          "name": string,
          "sets": number,
          "reps": string,
          "rest": number
        }
      ]
    }
  ]
}
`;

  const userPrompt = `
User profile:

Name: ${data.name}
Sex: ${data.sex}
Age: ${data.age}
Weight: ${data.weight}kg
Height: ${data.height}cm
Goal Weight: ${data.goalWeight}kg
Goal: ${data.goal}
Mode: ${data.mode}
Duration: ${data.weeks} weeks
Equipment: ${data.equipment.join(", ")}
Diet constraints:
${data.dietConstraints.join(", ")}

Calculated BMR:
${bmr}

Generate:
- precise macros
- realistic training split
- optimal recovery
- evidence-based recommendations
`;

  let retries = 3;

  while (retries > 0) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          temperature: 0.2,
          max_tokens: 3000,
          top_p: 0.9,
          frequency_penalty: 0.2,
          presence_penalty: 0.1,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const result = await response.json();

      const content =
        result.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty AI response");
      }

      const parsed = safeJSONParse(content);

      return validatePlan(parsed);

    } catch (error) {
      retries--;

      console.error("AI generation failed:", error);

      if (retries === 0) {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate plan");
}

export async function askCoach(
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>,
  profile: {
    name: string;
    age?: number;
    weight_kg?: number;
    height_cm?: number;
    goal?: string;
    mode?: string;
    target_kcal?: number;
    target_protein?: number;
  },
  todayStats: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  },
): Promise<string> {
  return chatWithCoach(
    messages as any,
    profile as any,
    todayStats,
  );
}

export {
  analyzeFoodImage,
  generateWorkoutPlan,
};