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
      const { data } = await supabase.from("workout_sessions").select("*").eq("user_id", userId).eq("session_date", todayISO()).single();
      sendSuccess(res, data);
      return;
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { data, error } = await supabase.from("workout_sessions").upsert({
        user_id: userId, session_date: body.session_date ?? todayISO(), ...body,
      }).select().single();
      if (error) { sendError(res, 400, "DB_ERROR", error.message); return; }
      sendSuccess(res, data);
      return;
    }

    sendError(res, 405, "METHOD", "Method not allowed");
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
