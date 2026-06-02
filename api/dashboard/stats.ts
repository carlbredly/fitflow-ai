import { supabase } from "../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";
import { calculateAll } from "../_lib/calculations";
import { todayISO } from "../_lib/date";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) { unauthorized(res); return; }
    const userId = await verifyToken(token);
    if (!userId) { unauthorized(res, "Token invalide"); return; }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    const macros = profile ? calculateAll(
      profile.weight_kg ?? 75, profile.height_cm ?? 175, profile.age ?? 30,
      (profile.sex ?? "m") as any, (profile.goal ?? "maintain") as any, (profile.mode ?? "normal") as any,
    ) : { kcal: 2000, protein: 120, carbs: 250, fat: 65 };

    const { data: logs } = await supabase.from("food_logs").select("*").eq("user_id", userId).eq("logged_date", todayISO()).order("created_at");
    const foodLogs = logs ?? [];
    const today = foodLogs.reduce((s: any, l: any) => ({
      kcal: s.kcal + (l.kcal ?? 0), protein: s.protein + (l.protein_g ?? 0),
      carbs: s.carbs + (l.carbs_g ?? 0), fat: s.fat + (l.fat_g ?? 0),
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

    const recent = foodLogs.slice(-5).reverse().map((l: any) => ({
      id: l.id, food_name: l.food_name, logged_date: l.logged_date, meal_type: l.meal_type, kcal: l.kcal,
    }));

    const { data: wLogs } = await supabase.from("weight_logs").select("*").eq("user_id", userId).order("logged_date", { ascending: true });
    const weights = (wLogs ?? []).map((w: any) => ({ date: w.logged_date.slice(5), w: w.weight_kg }));

    const { data: wSession } = await supabase.from("workout_sessions").select("*").eq("user_id", userId).eq("session_date", todayISO()).single();
    const session = wSession as Record<string, unknown> | null;

    const { count } = await supabase.from("workout_sessions").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("session_date", new Date(new Date().setDate(1)).toISOString().split("T")[0]!);

    const { data: streakData } = await supabase.from("food_logs").select("logged_date").eq("user_id", userId).order("logged_date", { ascending: false });
    const sd = (streakData ?? []) as Array<{ logged_date: string }>;
    let streak = 0;
    const uDays = [...new Set(sd.map((d: any) => d.logged_date))].sort().reverse();
    const check = new Date(todayISO());
    for (const day of uDays) {
      if (day === check.toISOString().split("T")[0]) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }

    sendSuccess(res, {
      profile: profile ? { name: profile.name, weight_kg: profile.weight_kg, goal_weight_kg: profile.goal_weight_kg, goal: profile.goal, mode: profile.mode, program_start_date: profile.program_start_date, deadline_weeks: profile.deadline_weeks } : null,
      macros, today, streak, sessionsThisMonth: count ?? 0, recentMeals: recent,
      todayWorkout: session ? { session_name: session.session_name as string | null, exercises: (session.exercises as Array<Record<string, unknown>>) ?? [], completed: (session.completed as boolean) ?? false } : null,
      weeklyWeight: weights,
    });
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
