import { calculateAll } from "@/lib/calculations";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";

export interface OnboardingData {
  name: string; sex: "m" | "f"; age: number; weight: number; height: number;
  goalWeight: number; dietConstraints: string[]; goal: "gain" | "loss" | "maintain";
  mode: "normal" | "strict" | "extreme"; weeks: number; equipment: string[];
}

export interface GeneratedPlan {
  macros: { kcal: number; protein: number; carbs: number; fat: number };
  coachSummary: string; weeklyChange: number; sessionsPerWeek: number;
  sessions: Array<{ day_index: number; session_name: string; exercises: Array<{ name: string; sets: number; reps: string; rest: number }> }>;
}

export function generateLocalFallback(data: OnboardingData): GeneratedPlan {
  const macros = calculateAll(data.weight || 75, data.height || 175, data.age || 30, data.sex, data.goal, data.mode);
  return {
    macros,
    coachSummary: "Plan calculé localement (IA indisponible). Ajuste selon tes besoins.",
    weeklyChange: data.goal === "gain" ? 0.5 : data.goal === "loss" ? -0.4 : 0,
    sessionsPerWeek: data.mode === "extreme" ? 5 : data.mode === "strict" ? 4 : 3,
    sessions: [],
  };
}

export async function generatePlan(data: OnboardingData, signal?: AbortSignal): Promise<GeneratedPlan> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? useAuthStore.getState().token ?? "";

  const res = await fetch("/api/ai/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify({
      name: data.name, sex: data.sex, age: data.age, weight_kg: data.weight,
      height_cm: data.height, goal_weight_kg: data.goalWeight, goal: data.goal,
      mode: data.mode, weeks: data.weeks, equipment: data.equipment,
      diet_constraints: data.dietConstraints,
    }),
    signal,
  });

  if (!res.ok) {
    if (res.headers.get("content-type")?.includes("text/html")) throw new Error("API non disponible");
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Erreur serveur");
  }

  const json = await res.json() as { success: boolean; data?: GeneratedPlan };
  return json.data!;
}

export async function askCoach(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  profile: Record<string, any>,
  todayStats: { kcal: number; protein: number; carbs: number; fat: number },
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? useAuthStore.getState().token ?? "";
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) return "Désolé, je n'ai pas pu traiter ta demande.";
  const data = await res.json() as { success: boolean; data?: { reply?: string } };
  return data?.data?.reply ?? "Désolé, je n'ai pas pu traiter ta demande.";
}
