import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED", message: "Token manquant" }, { status: 401 });
    }
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: { user } } = await anon.auth.getUser(auth.slice(7));
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED", message: "Token invalide" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

    const { data: profile } = await supabase.from("profiles").upsert({
      id: user.id, name: body.name, sex: body.sex, age: body.age,
      weight_kg: body.weight_kg, height_cm: body.height_cm,
      goal_weight_kg: body.goal_weight_kg, goal: body.goal, mode: body.mode,
      deadline_weeks: body.deadline_weeks, equipment: body.equipment,
      diet_constraints: body.diet_constraints,
      program_start_date: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    }).select().single();

    // Calculate macros
    const bmr = body.sex === "m"
      ? 10 * body.weight_kg + 6.25 * body.height_cm - 5 * body.age + 5
      : 10 * body.weight_kg + 6.25 * body.height_cm - 5 * body.age - 161;
    const baseMultiplier: Record<string, number> = { gain: 1.55, loss: 1.375, maintain: 1.55 };
    const modeAdj: Record<string, number> = { normal: 0, strict: 0.05, extreme: 0.1 };
    const tdee = Math.round(bmr * ((baseMultiplier[body.goal] ?? 1.55) + (modeAdj[body.mode] ?? 0)));
    const surplusMap: Record<string, number> = {
      gain_normal: 200, gain_strict: 300, gain_extreme: 500,
      loss_normal: -300, loss_strict: -400, loss_extreme: -500,
      maintain_normal: 0, maintain_strict: 0, maintain_extreme: 0,
    };
    const tk = tdee + (surplusMap[`${body.goal}_${body.mode}`] ?? 0);
    const pm: Record<string, number> = { normal: 1.6, strict: 1.8, extreme: 2.2 };
    const tp = Math.round((pm[body.mode] ?? 1.6) * body.weight_kg);
    const fat = Math.round(body.weight_kg * 0.8);
    const carbs = Math.max(0, Math.round((tk - tp * 4 - fat * 9) / 4));
    const macros = { kcal: tk, protein: tp, carbs, fat };

    await supabase.from("daily_targets").upsert({
      user_id: user.id, target_date: new Date().toISOString().split("T")[0],
      target_kcal: macros.kcal, target_protein: macros.protein,
      target_carbs: macros.carbs, target_fat: macros.fat,
    });

    return NextResponse.json({ success: true, data: { profile, macros } });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL", message: "Erreur serveur" }, { status: 500 });
  }
}
