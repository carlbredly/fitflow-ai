import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { WeekStats } from "@/lib/gamification";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions";

function buildFallbackSummary(stats: WeekStats, name: string): { aiSummary: string; highlights: string[] } {
  const highlights: string[] = [];
  if (stats.daysWithMeals >= 5) highlights.push(`${stats.daysWithMeals} jours avec repas suivis`);
  if (stats.workoutsCompleted >= 2) highlights.push(`${stats.workoutsCompleted} séance(s) complétée(s)`);
  if (stats.weightChange != null) highlights.push(`Poids : ${stats.weightChange > 0 ? "+" : ""}${stats.weightChange} kg`);
  highlights.push(`Adhérence : ${stats.adherenceScore}%`);
  highlights.push(`Streak repas : ${stats.foodStreak} jour(s)`);

  const aiSummary = `Bravo ${name} ! Cette semaine tu as enregistré des repas ${stats.daysWithMeals} jour(s) sur 7, avec une moyenne de ${stats.avgKcal} kcal/jour. ` +
    `${stats.workoutsCompleted} séance(s) complétée(s). Score d'adhérence : ${stats.adherenceScore}%. ` +
    (stats.weightChange != null ? `Évolution du poids : ${stats.weightChange} kg. ` : "") +
    `Continue sur cette lancée la semaine prochaine !`;

  return { aiSummary, highlights: highlights.slice(0, 4) };
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: { user } } = await anon.auth.getUser(auth.slice(7));
    if (!user) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const stats = body.stats as WeekStats;
    if (!stats) return NextResponse.json({ success: false, error: "INVALID" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
    const name = (profile?.name as string) ?? "Sportif";

    let aiSummary = "";
    let highlights: string[] = [];

    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const res = await fetch(DEEPSEEK_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            max_tokens: 600,
            temperature: 0.5,
            messages: [
              {
                role: "system",
                content: `Coach fitness. Réponds en JSON uniquement: {"aiSummary":"2-3 phrases encourageantes en français","highlights":["point 1","point 2","point 3"]}`,
              },
              {
                role: "user",
                content: `Rapport semaine ${stats.weekStart} au ${stats.weekEnd} pour ${name}. Jours repas:${stats.daysWithMeals}/7. Moy kcal:${stats.avgKcal}/${stats.targetKcal}. Séances:${stats.workoutsCompleted}/${stats.workoutsScheduled}. Adhérence:${stats.adherenceScore}%. Streak:${stats.foodStreak}. Poids:${stats.weightChange ?? "N/A"}kg.`,
              },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          const text = data.choices?.[0]?.message?.content ?? "";
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]) as { aiSummary?: string; highlights?: string[] };
            aiSummary = parsed.aiSummary ?? "";
            highlights = Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 4) : [];
          }
        }
      } catch { /* fallback */ }
    }

    if (!aiSummary) {
      const fb = buildFallbackSummary(stats, name);
      aiSummary = fb.aiSummary;
      highlights = fb.highlights;
    }

    return NextResponse.json({
      success: true,
      data: { weekStart: stats.weekStart, stats, aiSummary, highlights },
    });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 });
  }
}
