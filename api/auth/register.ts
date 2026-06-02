import { supabaseAnon } from "../_lib/supabase";
import { sendSuccess, sendError } from "../_lib/errors";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { email, password } = body;
    if (!email || !password || password.length < 6) { sendError(res, 400, "VALIDATION", "Email et mot de passe (6+ caractères) requis"); return; }
    const { data, error } = await supabaseAnon.auth.signUp({ email, password });
    if (error) { sendError(res, 400, error.code ?? "AUTH_ERROR", error.message); return; }
    sendSuccess(res, { userId: data.user?.id, access_token: data.session?.access_token }, 201);
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
