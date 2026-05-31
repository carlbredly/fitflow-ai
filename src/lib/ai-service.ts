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
  macros: { kcal: number; protein: number; carbs: number; fat: number };
  coachSummary: string;
  weeklyChange: number;
  sessionsPerWeek: number;
  sessions: Array<{
    day_index: number;
    session_name: string;
    exercises: Array<{ name: string; sets: number; reps: string; rest: number }>;
  }>;
}

export async function generatePlan(data: OnboardingData): Promise<GeneratedPlan> {
  const token = (await import("@/stores/auth.store")).useAuthStore.getState().token;

  const res = await fetch("/api/ai/generate-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      name: data.name,
      sex: data.sex,
      age: data.age,
      weight_kg: data.weight,
      height_cm: data.height,
      goal_weight_kg: data.goalWeight,
      goal: data.goal,
      mode: data.mode,
      weeks: data.weeks,
      equipment: data.equipment,
      diet_constraints: data.dietConstraints,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Erreur serveur");
  }

  const json = await res.json() as { success: boolean; data?: GeneratedPlan };
  return json.data!;
}

export async function askCoach(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  profile: {
    name: string; age?: number; weight_kg?: number; height_cm?: number;
    goal?: string; mode?: string; target_kcal?: number; target_protein?: number;
  },
  todayStats: { kcal: number; protein: number; carbs: number; fat: number },
): Promise<string> {
  return chatWithCoach(messages as any, profile as any, todayStats);
}

export { analyzeFoodImage, generateWorkoutPlan };
