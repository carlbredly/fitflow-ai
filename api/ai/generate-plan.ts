import { supabase } from "../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";
import { calculateAll } from "../_lib/calculations";
import { queryDeepSeek } from "../_lib/deepseek";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) { unauthorized(res); return; }
    const userId = await verifyToken(token);
    if (!userId) { unauthorized(res, "Token invalide"); return; }

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const macros = calculateAll(
      body.weight_kg || 75, body.height_cm || 175, body.age || 30,
      body.sex, body.goal, body.mode,
    );

    let sessions: Array<{ day_index: number; session_name: string; exercises: Array<{ name: string; sets: number; reps: string; rest: number }> }> = [];
    let coachSummary = "Plan adapté à ton profil.";

    try {
      const r = await queryDeepSeek(
        `Coach fitness expert. Génère programme en JSON UNIQUEMENT: {"coachSummary":"...","sessions":[{"day_index":1,"session_name":"...","exercises":[{"name":"","sets":4,"reps":"8-10","rest":90}]}],"notes":""}`,
        `${body.name} ${body.sex} ${body.age}ans ${body.weight_kg}kg ${body.height_cm}cm goal:${body.goal} mode:${body.mode} ${body.weeks}sem equip:${(body.equipment ?? []).join(",")} constraints:${(body.diet_constraints ?? []).filter((x: string) => x !== "Aucune").join(",")}`,
        { maxTokens: 2500 },
      );
      const m = r.match(/\{[\s\S]*\}/);
      const ai = JSON.parse(m?.[0] ?? "{}") as { coachSummary?: string; sessions?: typeof sessions; notes?: string };
      sessions = ai.sessions ?? [];
      coachSummary = ai.coachSummary ?? "Plan adapté à ton profil.";
    } catch {
      coachSummary = "Plan calculé localement (IA indisponible).";
    }

    sendSuccess(res, {
      macros,
      weeklyChange: body.goal === "gain" ? 0.5 : body.goal === "loss" ? -0.4 : 0,
      sessionsPerWeek: body.mode === "extreme" ? 6 : body.mode === "strict" ? 4 : 3,
      coachSummary,
      sessions,
      notes: "",
    });
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
