import { verifyToken, getBearerToken, unauthorized } from "../_lib/auth";
import { sendSuccess, sendError } from "../_lib/errors";
import { queryDeepSeekVision } from "../_lib/deepseek";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { sendError(res, 405, "METHOD", "Method not allowed"); return; }
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) { unauthorized(res); return; }
    const userId = await verifyToken(token);
    if (!userId) { unauthorized(res, "Token invalide"); return; }

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const r = await queryDeepSeekVision(
      `Tu es nutritionniste. Analyse cette photo et réponds UNIQUEMENT en JSON: {"aliments":[{"nom":"","quantite_g":0,"kcal":0,"proteines_g":0,"glucides_g":0,"lipides_g":0,"confiance":"haute|moyenne|basse"}],"total":{"kcal":0,"proteines_g":0,"glucides_g":0,"lipides_g":0},"notes":""}`,
      body.image_base64, body.mime_type, { maxTokens: 1500 },
    );
    const m = r.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m?.[0] ?? "{}");
    if (!parsed.aliments || !Array.isArray(parsed.aliments)) throw new Error("DeepSeek a retourné un JSON invalide");
    sendSuccess(res, parsed);
  } catch (e) {
    sendError(res, 502, "AI_ERROR", e instanceof Error ? e.message : "Erreur analyse image");
  }
}
