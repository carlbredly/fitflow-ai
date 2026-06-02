import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const { targetKcal, targetProtein, targetCarbs, targetFat, goal, mode } = body;

    const goalLabel = goal === "gain" ? "prise de masse musculaire" : goal === "loss" ? "perte de poids / déficit calorique" : "maintien du poids";
    const modeLabel = mode === "strict" ? "Strict (aliments propres, pas de junk food)" : "Flexible (quelques extras autorisés)";

    const res = await fetch(DEEPSEEK_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat", max_tokens: 2000, stream: false,
        messages: [
          {
            role: "system",
            content: `Tu es un diététicien-nutritionniste clinique spécialisé en nutrition sportive. Tu crées des plans alimentaires journaliers précis, savoureux et réalistes.
RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans backticks, sans markdown.
2. Les repas doivent être équilibrés et appétissants.
3. Les totaux de macros doivent correspondre aux cibles à ±5% près.
4. Chaque aliment doit avoir des valeurs cohérentes : kcal ≈ prot*4 + gluc*4 + lip*9.
5. Utilise des aliments courants, facilement disponibles en France.
6. Répartis les protéines uniformément sur tous les repas.

FORMAT REQUIS :
{
  "repas": [
    {
      "type": "breakfast",
      "aliments": [{ "nom": "Flocons d'avoine", "quantite_g": 80, "kcal": 296, "proteines_g": 10.0, "glucides_g": 54.0, "lipides_g": 6.0, "confiance": "haute" }]
    }
  ],
  "total": {"kcal": 0, "proteines_g": 0, "glucides_g": 0, "lipides_g": 0}
}`,
          },
          {
            role: "user",
            content: `Génère un plan repas complet pour une journée.
OBJECTIF : ${goalLabel}
MODE : ${modeLabel}
MACROS CIBLES : Calories: ${targetKcal} kcal, Protéines: ${targetProtein}g, Glucides: ${targetCarbs}g, Lipides: ${targetFat}g
Répartis sur : breakfast (25%), lunch (35%), dinner (30%), snack (10%).
JSON pur uniquement, aucun texte autour.`,
          },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json({ success: false, error: "AI_ERROR" }, { status: 502 });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ success: false, error: "PARSE_ERROR" }, { status: 502 });
    const parsed = JSON.parse(match[0]);
    if (!parsed.repas || !Array.isArray(parsed.repas)) throw new Error("Invalid format");
    return NextResponse.json({ success: true, data: parsed });
  } catch {
    return NextResponse.json({ success: false, error: "AI_ERROR", message: "Erreur génération plan" }, { status: 502 });
  }
}
