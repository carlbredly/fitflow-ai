import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const { query } = body;

    const res = await fetch(DEEPSEEK_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat", max_tokens: 600, stream: false,
        messages: [
          {
            role: "system",
            content: `Tu es une base de données nutritionnelle experte (référence Ciqual / USDA).
Réponds UNIQUEMENT avec un tableau JSON d'aliments correspondant à la recherche.
Format strict (tableau JSON pur, sans texte autour, sans backticks) :
[{"name":"Nom exact","per":"100g","kcal":165,"p":31.0,"c":0.0,"f":3.6}]
Règles : 4-6 résultats max. kcal cohérent avec macros (kcal ≈ p*4 + c*4 + f*9). Variantes pertinentes uniquement.`,
          },
          {
            role: "user",
            content: `Recherche nutritionnelle : "${query}". Valeurs pour 100g (ou l'unité naturelle si pertinent). JSON pur uniquement.`,
          },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json({ success: true, data: [] });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "[]";
    const stripped = text.replace(/```(?:json)?\s*/gi, "").trim();
    const arr = JSON.parse(stripped);
    return NextResponse.json({ success: true, data: Array.isArray(arr) ? arr.slice(0, 6) : [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
