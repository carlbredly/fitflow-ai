import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: { user } } = await anon.auth.getUser(auth.slice(7));
    if (!user) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const messages = body.messages ?? [];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const { data: logs } = await supabase.from("food_logs").select("kcal").eq("user_id", user.id).eq("logged_date", new Date().toISOString().split("T")[0]);
    const todayKcal = (logs ?? []).reduce((s: number, l: any) => s + (l.kcal ?? 0), 0);

    const sp = `Tu es Coach FitAI. Profil: ${profile?.name ?? "?"}, objectif:${profile?.goal ?? "?"}, mode:${profile?.mode ?? "?"}. Stats du jour: ${todayKcal}kcal. Réponds en français, max 3 paragraphes.`;
    const lastMsg = messages[messages.length - 1]?.content ?? "";

    const res = await fetch(DEEPSEEK_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat", max_tokens: 800, stream: false,
        messages: [{ role: "system", content: sp }, { role: "user", content: lastMsg }],
      }),
    });
    if (!res.ok) return NextResponse.json({ success: true, data: { reply: "Désolé, je n'ai pas pu traiter ta demande." } });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return NextResponse.json({ success: true, data: { reply: data.choices?.[0]?.message?.content ?? "Désolé, je n'ai pas pu traiter ta demande." } });
  } catch { return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 }); }
}
