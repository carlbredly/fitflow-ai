import { supabase } from "../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";
import { queryDeepSeek } from "../_lib/deepseek";
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
    const messages = body.messages ?? [];

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    const { data: logs } = await supabase.from("food_logs").select("kcal").eq("user_id", userId).eq("logged_date", todayISO());
    const todayKcal = (logs ?? []).reduce((s: number, l: any) => s + (l.kcal ?? 0), 0);

    const sp = `Tu es Coach FitAI. Profil: ${profile?.name ?? "?"}, objectif:${profile?.goal ?? "?"}, mode:${profile?.mode ?? "?"}. Stats du jour: ${todayKcal}kcal. Réponds en français, max 3 paragraphes.`;
    const lastMsg = messages[messages.length - 1]?.content ?? "";
    const reply = await queryDeepSeek(sp, lastMsg, { maxTokens: 800 });

    sendSuccess(res, { reply });
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
