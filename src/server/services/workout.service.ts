import { supabase } from "../lib/supabase.js";
import { todayISO } from "../lib/date.js";

export async function getTodayWorkout(userId: string) {
  const { data } = await supabase.from("workout_sessions").select("*").eq("user_id", userId).eq("session_date", todayISO()).single();
  return data;
}
export async function upsertWorkout(userId: string, s: Record<string, unknown>) {
  const { data } = await supabase.from("workout_sessions").upsert({
    user_id: userId, session_date: s.session_date ?? todayISO(), ...s,
  } as Record<string, unknown>).select().single();
  return data;
}
