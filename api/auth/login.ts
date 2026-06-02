import { supabaseAnon } from "../_lib/supabase";
import { sendSuccess, sendError } from "../_lib/errors";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const { email, password } = body;
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) { sendError(res, 401, error.code ?? "AUTH_ERROR", error.message); return; }
    sendSuccess(res, { userId: data.user?.id, access_token: data.session?.access_token });
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
