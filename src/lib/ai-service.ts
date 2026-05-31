import { analyzeFoodImage, chatWithCoach, generateWorkoutPlan } from "@/lib/deepseek";
import { calculateAll } from "@/lib/calculations";

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

export function checkApiKey(): boolean {
  try {
    return !!import.meta.env.VITE_DEEPSEEK_API_KEY;
  } catch {
    return false;
  }
}

export function generateLocalFallback(data: OnboardingData): GeneratedPlan {
  const macros = calculateAll(
    data.weight || 75, data.height || 175, data.age || 30,
    data.sex, data.goal, data.mode,
  );
  return {
    macros,
    coachSummary: "Plan calculé localement (IA indisponible). Ajuste selon tes besoins.",
    weeklyChange: data.goal === "gain" ? 0.5 : data.goal === "loss" ? -0.4 : 0,
    sessionsPerWeek: data.mode === "extreme" ? 5 : data.mode === "strict" ? 4 : 3,
    sessions: [],
  };
}

export async function generatePlan(
  data: OnboardingData,
  signal?: AbortSignal,
): Promise<GeneratedPlan> {
  const maxRetries = 3;
  const baseDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutMs = 20000;

      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const combinedSignal = signal
        ? combineAbortSignals(signal, controller.signal)
        : controller.signal;

      const token = (await import("@/stores/auth.store")).useAuthStore.getState().token;

      const apiBase = (typeof window !== "undefined" && import.meta.env.VITE_API_URL) || "";
      const res = await fetch(`${apiBase}/api/ai/generate-plan`, {
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
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? "Erreur serveur");
      }

      const json = await res.json() as { success: boolean; data?: GeneratedPlan };
      return json.data!;
    } catch (err) {
      const isAborted = err instanceof DOMException && err.name === "AbortError";

      if (isAborted && signal?.aborted) {
        throw new Error("Génération annulée");
      }

      if (isAborted) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error("Le serveur a mis trop de temps à répondre (plus de 20s)");
      }

      if (attempt >= maxRetries) {
        if (err instanceof Error && err.message.includes("401")) {
          throw new Error("Erreur d'authentification API");
        }
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Impossible de générer le plan après plusieurs tentatives");
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) { controller.abort(); return controller.signal; }
    sig.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
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
