const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY ?? "";
const BASE = "https://api.deepseek.com/v1/chat/completions";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string | DeepSeekContentPart[];
}

interface DeepSeekContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface FoodItem {
  nom: string;
  quantite_g: number;
  kcal: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
  confiance: "haute" | "moyenne" | "basse";
}

interface FoodAnalysisResult {
  aliments: FoodItem[];
  total: {
    kcal: number;
    proteines_g: number;
    glucides_g: number;
    lipides_g: number;
  };
  notes: string;
}

export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string,
): Promise<FoodAnalysisResult> {
  const response = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-vision",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: `Identifie tous les aliments dans cette assiette.
            Réponds UNIQUEMENT en JSON valide:
            {
              "aliments": [
                {
                  "nom": "string",
                  "quantite_g": number,
                  "kcal": number,
                  "proteines_g": number,
                  "glucides_g": number,
                  "lipides_g": number,
                  "confiance": "haute|moyenne|basse"
                }
              ],
              "total": { "kcal": number, "proteines_g": number, "glucides_g": number, "lipides_g": number },
              "notes": "string (conseils nutritionnels)"
            }`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? "{}");
}

interface ProfileForAI {
  name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string | null;
  mode: string | null;
  target_kcal?: number;
  target_protein?: number;
}

interface DayStatsForAI {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithCoach(
  messages: ChatMessageInput[],
  profile: ProfileForAI,
  todayStats: DayStatsForAI,
): Promise<string> {
  const systemPrompt = `Tu es Coach FitAI, un coach fitness et nutrition expert, motivant et précis.

Profil utilisateur: ${profile.name}, ${profile.age ?? "?"} ans, ${profile.weight_kg ?? "?"}kg, ${profile.height_cm ?? "?"}cm
Objectif: ${profile.goal ?? "non défini"}, Mode: ${profile.mode ?? "normal"}
Macros cibles: ${profile.target_kcal ?? "?"} kcal, ${profile.target_protein ?? "?"}g protéines
Aujourd'hui: ${todayStats.kcal}/${profile.target_kcal ?? "?"} kcal consommées, ${todayStats.protein}g protéines

Règles:
- Réponds en français uniquement
- Sois précis avec des chiffres concrets
- Adapte chaque conseil au profil et aux données du jour
- Maximum 3 paragraphes par réponse
- Utilise des emojis avec parcimonie`;

  const response = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "Désolé, je n'ai pas pu trainer ta demande.";
}

interface WorkoutPlanRequest {
  goal: string;
  mode: string;
  equipment: string[];
  weeks: number;
  sex: string | null;
  weight_kg: number | null;
}

interface WorkoutPlanResult {
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
  notes: string;
}

export async function generateWorkoutPlan(
  req: WorkoutPlanRequest,
): Promise<WorkoutPlanResult> {
  const response = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `Tu es un coach sportif expert. Génère un programme d'entraînement en JSON.
Réponds UNIQUEMENT en JSON valide:
{
  "sessions": [
    {
      "day_index": number (1-7),
      "session_name": "string",
      "exercises": [
        { "name": "string", "sets": number, "reps": "string", "rest": number }
      ]
    }
  ],
  "notes": "string"
}`,
        },
        {
          role: "user",
          content: `Génère un programme sur ${req.weeks} semaines.
Objectif: ${req.goal}
Mode: ${req.mode}
Équipement: ${req.equipment.join(", ")}
Poids: ${req.weight_kg ?? "?"}kg
Sexe: ${req.sex ?? "?"}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch?.[0] ?? '{"sessions":[],"notes":""}');
}
