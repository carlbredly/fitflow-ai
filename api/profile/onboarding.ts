import { supabase } from "../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";
import { calculateAll } from "../_lib/calculations";
import { todayISO } from "../_lib/date";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) { unauthorized(res); return; }
    const userId = await verifyToken(token);
    if (!userId) { unauthorized(res, "Token invalide"); return; }
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { data: profile } = await supabase.from("profiles").upsert({
      id: userId, name: body.name, sex: body.sex, age: body.age,
      weight_kg: body.weight_kg, height_cm: body.height_cm,
      goal_weight_kg: body.goal_weight_kg, goal: body.goal, mode: body.mode,
      deadline_weeks: body.deadline_weeks, equipment: body.equipment,
      diet_constraints: body.diet_constraints,
      program_start_date: todayISO(), updated_at: new Date().toISOString(),
    }).select().single();

    const macros = calculateAll(body.weight_kg, body.height_cm, body.age, body.sex, body.goal, body.mode);
    await supabase.from("daily_targets").upsert({
      user_id: userId, target_date: todayISO(),
      target_kcal: macros.kcal, target_protein: macros.protein,
      target_carbs: macros.carbs, target_fat: macros.fat,
    });

    sendSuccess(res, { profile, macros });
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
