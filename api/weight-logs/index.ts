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
      const { data } = await supabase.from("weight_logs").select("*").eq("user_id", userId).order("logged_date", { ascending: true });
      sendSuccess(res, data ?? []);
      return;
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { data, error } = await supabase.from("weight_logs").upsert({
        user_id: userId, logged_date: body.logged_date ?? todayISO(),
        weight_kg: body.weight_kg, note: body.note ?? null,
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
