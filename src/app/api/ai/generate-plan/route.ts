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

    // Calculate macros locally (same logic as before)
    const bmr = body.sex === "m" ? 10 * body.weight_kg + 6.25 * body.height_cm - 5 * body.age + 5 : 10 * body.weight_kg + 6.25 * body.height_cm - 5 * body.age - 161;
    const base: Record<string, number> = { gain: 1.55, loss: 1.375, maintain: 1.55 };
    const adj: Record<string, number> = { normal: 0, strict: 0.05, extreme: 0.1 };
    const tdee = Math.round(bmr * ((base[body.goal] ?? 1.55) + (adj[body.mode] ?? 0)));
    const sMap: Record<string, number> = { gain_normal: 200, gain_strict: 300, gain_extreme: 500, loss_normal: -300, loss_strict: -400, loss_extreme: -500, maintain_normal: 0, maintain_strict: 0, maintain_extreme: 0 };
    const pm: Record<string, number> = { normal: 1.6, strict: 1.8, extreme: 2.2 };
    const tk = tdee + (sMap[`${body.goal}_${body.mode}`] ?? 0);
    const tp = Math.round((pm[body.mode] ?? 1.6) * body.weight_kg);
    const fat = Math.round(body.weight_kg * 0.8);
    const carbs = Math.max(0, Math.round((tk - tp * 4 - fat * 9) / 4));
    const macros = { kcal: tk, protein: tp, carbs, fat: fat };

    let sessions: Array<{ day_index: number; session_name: string; exercises: Array<{ name: string; sets: number; reps: string; rest: number }> }> = [];
    let coachSummary = "Plan adapté à ton profil.";

    try {
      const res = await fetch(DEEPSEEK_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: "deepseek-chat", max_tokens: 2500, stream: false,
          messages: [
            { role: "system", content: `Coach fitness expert. Génère programme en JSON UNIQUEMENT: {"coachSummary":"...","sessions":[{"day_index":1,"session_name":"...","exercises":[{"name":"","sets":4,"reps":"8-10","rest":90}]}],"notes":""}` },
            { role: "user", content: `${body.name} ${body.sex} ${body.age}ans ${body.weight_kg}kg ${body.height_cm}cm goal:${body.goal} mode:${body.mode} ${body.weeks}sem equip:${(body.equipment ?? []).join(",")} constraints:${(body.diet_constraints ?? []).filter((x: string) => x !== "Aucune").join(",")}` },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const text = data.choices?.[0]?.message?.content ?? "";
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const ai = JSON.parse(match[0]);
          sessions = ai.sessions ?? [];
          coachSummary = ai.coachSummary ?? "Plan adapté à ton profil.";
        }
      }
    } catch { coachSummary = "Plan calculé localement (IA indisponible)."; }

    return NextResponse.json({
      success: true, data: {
        macros, weeklyChange: body.goal === "gain" ? 0.5 : body.goal === "loss" ? -0.4 : 0,
        sessionsPerWeek: body.mode === "extreme" ? 6 : body.mode === "strict" ? 4 : 3,
        coachSummary, sessions, notes: "",
      },
    });
  } catch { return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 }); }
}
