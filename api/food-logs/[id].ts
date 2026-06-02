import { supabase } from "../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";

export default async function handler(req: any, res: any) {
  if (req.method !== "DELETE") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) { unauthorized(res); return; }
    const userId = await verifyToken(token);
    if (!userId) { unauthorized(res, "Token invalide"); return; }
    const id = req.query?.id as string;
    if (!id) { sendError(res, 400, "VALIDATION", "ID requis"); return; }
    await supabase.from("food_logs").delete().eq("id", id).eq("user_id", userId);
    sendSuccess(res, null);
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
