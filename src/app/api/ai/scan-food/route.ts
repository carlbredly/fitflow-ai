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
    const res = await fetch(DEEPSEEK_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat", max_tokens: 1500, stream: false,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${body.mime_type};base64,${body.image_base64}` } },
            { type: "text", text: `Tu es nutritionniste. Analyse cette photo et réponds UNIQUEMENT en JSON: {"aliments":[{"nom":"","quantite_g":0,"kcal":0,"proteines_g":0,"glucides_g":0,"lipides_g":0,"confiance":"haute|moyenne|basse"}],"total":{"kcal":0,"proteines_g":0,"glucides_g":0,"lipides_g":0},"notes":""}` },
          ],
        }],
      }),
    });
    if (!res.ok) return NextResponse.json({ success: false, error: "AI_ERROR" }, { status: 502 });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? "{}");
    if (!parsed.aliments || !Array.isArray(parsed.aliments)) throw new Error("Invalid JSON");
    return NextResponse.json({ success: true, data: parsed });
  } catch {
    return NextResponse.json({ success: false, error: "AI_ERROR", message: "Erreur analyse image" }, { status: 502 });
  }
}
