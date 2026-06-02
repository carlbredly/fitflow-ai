import { supabase } from "../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) { unauthorized(res); return; }
    const userId = await verifyToken(token);
    if (!userId) { unauthorized(res, "Token invalide"); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!profile) { sendError(res, 404, "NOT_FOUND", "Profil non trouvé"); return; }
    sendSuccess(res, profile);
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
