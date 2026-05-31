import { supabase } from "../lib/supabase.js";
import type { FoodLog, MealType } from "@/types/database.types.js";
import { todayISO } from "../lib/date.js";
import { queryDeepSeek, queryDeepSeekVision, streamDeepSeek } from "../lib/deepseek.js";
import { calculateAll, calculateWeeklyChange } from "../lib/calculations.js";
import type { Goal, Mode, Sex } from "../lib/calculations.js";
import { getDashboard } from "./dashboard.service.js";

export async function createFoodLog(userId: string, input: {
  meal_type: MealType; food_name: string; quantity_g?: number;
  kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number;
  photo_url?: string; source?: string; logged_date?: string;
}): Promise<FoodLog> {
  const { data, error } = await supabase.from("food_logs").insert({
    user_id: userId, meal_type: input.meal_type, food_name: input.food_name,
    logged_date: input.logged_date ?? todayISO(),
    quantity_g: input.quantity_g ?? null, kcal: input.kcal ?? null,
    protein_g: input.protein_g ?? null, carbs_g: input.carbs_g ?? null,
    fat_g: input.fat_g ?? null, photo_url: input.photo_url ?? null,
    source: input.source ?? "manual",
  } as Record<string, unknown>).select().single();
  if (error) throw error;
  return data as FoodLog;
}

export async function getFoodLogs(userId: string, date?: string): Promise<FoodLog[]> {
  const { data } = await supabase.from("food_logs").select("*").eq("user_id", userId).eq("logged_date", date ?? todayISO()).order("created_at");
  return (data ?? []) as FoodLog[];
}

export async function deleteFoodLog(id: string, userId: string) {
  await supabase.from("food_logs").delete().eq("id", id).eq("user_id", userId);
}

export async function analyzeFood(base64: string, mime: string) {
  const r = await queryDeepSeekVision(
    `Tu es nutritionniste. Analyse cette photo et réponds UNIQUEMENT en JSON: {"aliments":[{"nom":"","quantite_g":0,"kcal":0,"proteines_g":0,"glucides_g":0,"lipides_g":0,"confiance":"haute|moyenne|basse"}],"total":{"kcal":0,"proteines_g":0,"glucides_g":0,"lipides_g":0},"notes":""}`,
    base64, mime,
    { maxTokens: 1500 },
  );
  const m = r.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(m?.[0] ?? "{}");
  if (!parsed.aliments || !Array.isArray(parsed.aliments)) {
    throw new Error("DeepSeek a retourné un JSON invalide");
  }
  return parsed;
}

export async function generatePlan(d: {
  name: string; sex: "m" | "f"; age: number; weight_kg: number;
  height_cm: number; goal_weight_kg: number;
  goal: Goal; mode: Mode; weeks: number;
  equipment: string[]; diet_constraints: string[];
}) {
  const macros = calculateAll(d.weight_kg || 75, d.height_cm || 175, d.age || 30, d.sex as Sex, d.goal, d.mode);
  try {
    const r = await queryDeepSeek(
      `Coach fitness expert. Génère programme en JSON UNIQUEMENT: {"coachSummary":"...","sessions":[{"day_index":1,"session_name":"...","exercises":[{"name":"","sets":4,"reps":"8-10","rest":90}]}],"notes":""}`,
      `${d.name} ${d.sex} ${d.age}ans ${d.weight_kg}kg ${d.height_cm}cm goal:${d.goal} mode:${d.mode} ${d.weeks}sem equip:${d.equipment.join(",")} constraints:${d.diet_constraints.filter(x=>x!=="Aucune").join(",")}`,
      { maxTokens: 2500 },
    );
    const m = r.match(/\{[\s\S]*\}/);
    const ai = JSON.parse(m?.[0] ?? "{}") as { coachSummary?: string; sessions?: Array<{ day_index: number; session_name: string; exercises: Array<{ name: string; sets: number; reps: string; rest: number }> }>; notes?: string };
    return {
      macros, weeklyChange: calculateWeeklyChange(d.goal, d.mode),
      sessionsPerWeek: d.mode === "extreme" ? 6 : d.mode === "strict" ? 4 : 3,
      coachSummary: ai.coachSummary ?? "Plan adapté à ton profil.", sessions: ai.sessions ?? [], notes: ai.notes ?? "",
    };
  } catch {
    return {
      macros, weeklyChange: calculateWeeklyChange(d.goal, d.mode),
      sessionsPerWeek: d.mode === "extreme" ? 6 : d.mode === "strict" ? 4 : 3,
      coachSummary: "Plan calculé localement (IA indisponible).", sessions: [],
    };
  }
}

export async function chat(userId: string, messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const dash = await getDashboard(userId);
  const profile = dash.profile;
  const sp = `Tu es Coach FitAI. Profil: ${profile?.name ?? "?"}, objectif:${profile?.goal??"?"}, mode:${profile?.mode??"?"}. Stats du jour: ${dash.today.kcal}kcal. Réponds en français, max 3 paragraphes.`;
  return queryDeepSeek(sp, messages[messages.length - 1]?.content ?? "", { maxTokens: 800 });
}

export async function chatStream(userId: string, messages: Array<{ role: "user" | "assistant"; content: string }>) {
  const dash = await getDashboard(userId);
  const profile = dash.profile;
  const sp = `Coach FitAI. Profil:${profile?.name??"?"} goal:${profile?.goal??"?"}. Stats:${dash.today.kcal}kcal. Français, 2 paragraphes max.`;
  return streamDeepSeek(sp, messages);
}

export async function logWeight(userId: string, weight_kg: number, date?: string, note?: string) {
  const { data } = await supabase.from("weight_logs").upsert({
    user_id: userId, logged_date: date ?? todayISO(), weight_kg, note: note ?? null,
  } as Record<string, unknown>).select().single();
  return data;
}

export async function getWeights(userId: string) {
  const { data } = await supabase.from("weight_logs").select("*").eq("user_id", userId).order("logged_date", { ascending: true });
  return (data ?? []);
}
