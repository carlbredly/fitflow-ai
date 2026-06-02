import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: { "content-type": "application/json" } });
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: { user } } = await anon.auth.getUser(auth.slice(7));
    if (!user) return new Response(JSON.stringify({ success: false, error: "UNAUTHORIZED" }), { status: 401, headers: { "content-type": "application/json" } });

    const body = await request.json();
    const messages = body.messages ?? [];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const { data: logs } = await supabase.from("food_logs").select("kcal").eq("user_id", user.id).eq("logged_date", new Date().toISOString().split("T")[0]);
    const todayKcal = (logs ?? []).reduce((s: number, l: any) => s + (l.kcal ?? 0), 0);
    const sp = `Coach FitAI. Profil:${profile?.name ?? "?"} goal:${profile?.goal ?? "?"}. Stats:${todayKcal}kcal. Français, 2 paragraphes max.`;

    const aiRes = await fetch(DEEPSEEK_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", max_tokens: 1000, stream: true, messages: [{ role: "system", content: sp }, ...messages] }),
    });
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ success: false, error: "AI_ERROR" }), { status: 502, headers: { "content-type": "application/json" } });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = aiRes.body.getReader();

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(chunk));
          }
        } catch { controller.close(); }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: "INTERNAL" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
