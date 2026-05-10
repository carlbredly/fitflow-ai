import { supabase } from "../lib/supabase.js";
import { calculateAll } from "../lib/calculations.js";
import type { Goal, Mode, Sex, MacroTargets } from "../lib/calculations.js";
import { todayISO } from "../lib/date.js";
import type { Profile } from "@/types/database.types.js";

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data as Profile | null;
}

export async function saveOnboarding(
  userId: string,
  d: {
    name: string; sex: "m" | "f"; age: number; weight_kg: number;
    height_cm: number; goal_weight_kg: number;
    goal: Goal; mode: Mode; deadline_weeks: number;
    equipment: string[]; diet_constraints: string[];
  },
) {
  const { data: profile } = await supabase.from("profiles").upsert({
    id: userId, name: d.name, sex: d.sex, age: d.age,
    weight_kg: d.weight_kg, height_cm: d.height_cm,
    goal_weight_kg: d.goal_weight_kg, goal: d.goal, mode: d.mode,
    deadline_weeks: d.deadline_weeks, equipment: d.equipment,
    diet_constraints: d.diet_constraints,
    program_start_date: todayISO(), updated_at: new Date().toISOString(),
  } as Record<string, unknown>).select().single();

  const macros = calculateAll(
    d.weight_kg, d.height_cm, d.age, d.sex as Sex, d.goal, d.mode,
  );

  await supabase.from("daily_targets").upsert({
    user_id: userId, target_date: todayISO(),
    target_kcal: macros.kcal, target_protein: macros.protein,
    target_carbs: macros.carbs, target_fat: macros.fat,
  } as Record<string, unknown>);

  return { profile: profile as Profile, macros };
}

export async function getDashboard(userId: string) {
  const profile = await getProfile(userId);
  let macros: MacroTargets = { kcal: 2000, protein: 120, carbs: 250, fat: 65 };
  if (profile) {
    macros = calculateAll(
      profile.weight_kg ?? 75, profile.height_cm ?? 175, profile.age ?? 30,
      (profile.sex ?? "m") as Sex, (profile.goal ?? "maintain") as Goal, (profile.mode ?? "normal") as Mode,
    );
  }

  const { data: logs } = await supabase.from("food_logs").select("*").eq("user_id", userId).eq("logged_date", todayISO()).order("created_at");
  const foodLogs = (logs ?? []) as Array<{ kcal: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; id: string; food_name: string; logged_date: string; meal_type: string }>;

  const today = foodLogs.reduce((s, l) => ({
    kcal: s.kcal + (l.kcal ?? 0),
    protein: s.protein + (l.protein_g ?? 0),
    carbs: s.carbs + (l.carbs_g ?? 0),
    fat: s.fat + (l.fat_g ?? 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const recent = foodLogs.slice(-5).reverse().map(l => ({
    id: l.id, food_name: l.food_name, logged_date: l.logged_date, meal_type: l.meal_type, kcal: l.kcal,
  }));

  const { data: wLogs } = await supabase.from("weight_logs").select("*").eq("user_id", userId).order("logged_date", { ascending: true });
  const weights = (wLogs ?? []) as Array<{ logged_date: string; weight_kg: number }>;

  const { data: wSession } = await supabase.from("workout_sessions").select("*").eq("user_id", userId).eq("session_date", todayISO()).single();
  const session = wSession as Record<string, unknown> | null;

  const { count } = await supabase.from("workout_sessions").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("session_date", new Date(new Date().setDate(1)).toISOString().split("T")[0]!);

  const { data: streakData } = await supabase.from("food_logs").select("logged_date").eq("user_id", userId).order("logged_date", { ascending: false });
  const sd = (streakData ?? []) as Array<{ logged_date: string }>;
  let streak = 0;
  const uDays = [...new Set(sd.map(d => d.logged_date))].sort().reverse();
  const check = new Date(todayISO());
  for (const day of uDays) {
    if (day === check.toISOString().split("T")[0]) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }

  return {
    profile: profile ? { name: profile.name, weight_kg: profile.weight_kg, goal_weight_kg: profile.goal_weight_kg, goal: profile.goal, mode: profile.mode, program_start_date: profile.program_start_date, deadline_weeks: profile.deadline_weeks } : null,
    macros, today, streak, sessionsThisMonth: count ?? 0,
    recentMeals: recent,
    todayWorkout: session ? { session_name: session.session_name as string | null, exercises: (session.exercises as Array<Record<string, unknown>>) ?? [], completed: (session.completed as boolean) ?? false } : null,
    weeklyWeight: weights.map(w => ({ date: w.logged_date.slice(5), w: w.weight_kg })),
  };
}
