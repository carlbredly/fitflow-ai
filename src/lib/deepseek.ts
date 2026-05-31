// Client-side DeepSeek helpers.
// These call the API via /api/ai/* backend routes (key is server-side).
// Do NOT use import.meta.env.VITE_DEEPSEEK_API_KEY here — the key lives on the server.

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
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

export async function chatWithCoach(
  messages: ChatMessageInput[],
  profile: ProfileForAI,
  todayStats: DayStatsForAI,
): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) return "Désolé, je n'ai pas pu traiter ta demande.";
  const data = (await res.json()) as { success: boolean; data?: { reply?: string } };
  return data?.data?.reply ?? "Désolé, je n'ai pas pu traiter ta demande.";
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
    exercises: Array<{ name: string; sets: number; reps: string; rest: number }>;
  }>;
  notes: string;
}

export async function generateWorkoutPlan(
  req: WorkoutPlanRequest,
): Promise<WorkoutPlanResult> {
  const res = await fetch("/api/ai/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goal: req.goal,
      mode: req.mode,
      weeks: req.weeks,
      equipment: req.equipment,
      sex: req.sex,
      weight_kg: req.weight_kg,
    }),
  });
  if (!res.ok) throw new Error("Erreur API génération programme");
  const data = (await res.json()) as { success: boolean; data?: WorkoutPlanResult };
  const plan = data?.data;
  return plan ?? { sessions: [], notes: "Le service IA n'a pas répondu." };
}
