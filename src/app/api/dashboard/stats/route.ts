import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: { user } } = await anon.auth.getUser(auth.slice(7));
    if (!user) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const userId = user.id;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    const today = new Date().toISOString().split("T")[0];

    const macros = profile ? (() => {
      const bmr = (profile.sex === "m" ? 10 : 1) * (profile.weight_kg ?? 75) + 6.25 * (profile.height_cm ?? 175) - 5 * (profile.age ?? 30) + (profile.sex === "m" ? 5 : -161);
      const baseM: Record<string, number> = { gain: 1.55, loss: 1.375, maintain: 1.55 };
      const adj: Record<string, number> = { normal: 0, strict: 0.05, extreme: 0.1 };
      const tdee = Math.round(bmr * ((baseM[profile.goal ?? "maintain"] ?? 1.55) + (adj[profile.mode ?? "normal"] ?? 0)));
      const s: Record<string, number> = { gain_normal: 200, gain_strict: 300, gain_extreme: 500, loss_normal: -300, loss_strict: -400, loss_extreme: -500, maintain_normal: 0, maintain_strict: 0, maintain_extreme: 0 };
      const pm: Record<string, number> = { normal: 1.6, strict: 1.8, extreme: 2.2 };
      const tk = tdee + (s[`${profile.goal}_${profile.mode}`] ?? 0);
      const tp = Math.round((pm[profile.mode ?? "normal"] ?? 1.6) * (profile.weight_kg ?? 75));
      const fat = Math.round((profile.weight_kg ?? 75) * 0.8);
      const carbs = Math.max(0, Math.round((tk - tp * 4 - fat * 9) / 4));
      return { kcal: tk, protein: tp, carbs, fat };
    })() : { kcal: 2000, protein: 120, carbs: 250, fat: 65 };

    const { data: logs } = await supabase.from("food_logs").select("*").eq("user_id", userId).eq("logged_date", today).order("created_at");
    const foodLogs = logs ?? [];
    const todayStats = foodLogs.reduce((s: any, l: any) => ({
      kcal: s.kcal + (l.kcal ?? 0), protein: s.protein + (l.protein_g ?? 0),
      carbs: s.carbs + (l.carbs_g ?? 0), fat: s.fat + (l.fat_g ?? 0),
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

    const { data: wLogs } = await supabase.from("weight_logs").select("*").eq("user_id", userId).order("logged_date", { ascending: true });
    const weights = (wLogs ?? []).map((w: any) => ({ date: w.logged_date.slice(5), w: w.weight_kg }));

    const { data: wSession } = await supabase.from("workout_sessions").select("*").eq("user_id", userId).eq("session_date", today).single();
    const { count } = await supabase.from("workout_sessions").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("session_date", new Date(new Date().setDate(1)).toISOString().split("T")[0]!);

    const { data: streakData } = await supabase.from("food_logs").select("logged_date").eq("user_id", userId).order("logged_date", { ascending: false });
    const sd = (streakData ?? []) as Array<{ logged_date: string }>;
    let streak = 0;
    const uDays = [...new Set(sd.map((d: any) => d.logged_date))].sort().reverse();
    const check = new Date(today);
    for (const day of uDays) {
      if (day === check.toISOString().split("T")[0]) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }

    return NextResponse.json({
      success: true, data: {
        profile: profile ? { name: profile.name, weight_kg: profile.weight_kg, goal_weight_kg: profile.goal_weight_kg, goal: profile.goal, mode: profile.mode, program_start_date: profile.program_start_date, deadline_weeks: profile.deadline_weeks } : null,
        macros, today: todayStats, streak, sessionsThisMonth: count ?? 0,
        recentMeals: foodLogs.slice(-5).reverse().map((l: any) => ({ id: l.id, food_name: l.food_name, logged_date: l.logged_date, meal_type: l.meal_type, kcal: l.kcal })),
        weeklyWeight: weights,
      },
    });
  } catch { return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 }); }
}
