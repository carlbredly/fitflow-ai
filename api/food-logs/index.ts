import { supabase } from "../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";
import { todayISO } from "../_lib/date";

export default async function handler(req: any, res: any) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) { unauthorized(res); return; }
    const userId = await verifyToken(token);
    if (!userId) { unauthorized(res, "Token invalide"); return; }

    if (req.method === "GET") {
      const date = (req.query?.date as string) ?? todayISO();
      const { data } = await supabase.from("food_logs").select("*").eq("user_id", userId).eq("logged_date", date).order("created_at");
      sendSuccess(res, data ?? []);
      return;
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { data, error } = await supabase.from("food_logs").insert({
        user_id: userId, meal_type: body.meal_type, food_name: body.food_name,
        logged_date: body.logged_date ?? todayISO(),
        quantity_g: body.quantity_g ?? null, kcal: body.kcal ?? null,
        protein_g: body.protein_g ?? null, carbs_g: body.carbs_g ?? null,
        fat_g: body.fat_g ?? null, photo_url: body.photo_url ?? null,
        source: body.source ?? "manual",
      }).select().single();
      if (error) { sendError(res, 400, "DB_ERROR", error.message); return; }
      sendSuccess(res, data, 201);
      return;
    }

    sendError(res, 405, "METHOD", "Method not allowed");
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
