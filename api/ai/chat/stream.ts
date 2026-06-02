import { supabase } from "../../_lib/supabase";
import { verifyToken, getBearerToken, unauthorized } from "../../_lib/auth";
import { sendError } from "../../_lib/errors";
import { todayISO } from "../../_lib/date";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions";

function getApiKey(): string {
  return process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || "";
}

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

    const sp = `Coach FitAI. Profil:${profile?.name ?? "?"} goal:${profile?.goal ?? "?"}. Stats:${todayKcal}kcal. Français, 2 paragraphes max.`;

    const aiRes = await fetch(DEEPSEEK_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getApiKey()}` },
      body: JSON.stringify({
        model: "deepseek-chat", max_tokens: 1000, stream: true,
        messages: [{ role: "system", content: sp }, ...messages],
      }),
    });
    if (!aiRes.ok || !aiRes.body) { sendError(res, 502, "AI_ERROR", "Erreur DeepSeek stream"); return; }

    res.writeHead(200, {
      "Content-Type": "text/event-stream", "Cache-Control": "no-cache",
      Connection: "keep-alive", "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { res.write("data: [DONE]\n\n"); continue; }
          try {
            const p = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const token = p.choices?.[0]?.delta?.content;
            if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
          } catch { /* skip */ }
        }
      }
    } finally {
      res.end();
    }
  } catch (e) {
    sendError(res, 500, "INTERNAL", "Erreur serveur");
  }
}
