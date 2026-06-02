import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateLocalWorkoutPlan, sanitizeAiSessions } from "@/lib/workout-plan";
import type { Goal, Mode } from "@/lib/calculations";

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

    const planInput = {
      goal: (body.goal ?? "maintain") as Goal,
      mode: (body.mode ?? "normal") as Mode,
      weeks: Number(body.weeks) || 4,
      equipment: Array.isArray(body.equipment) && body.equipment.length ? body.equipment : ["home"],
    };

    let sessions = generateLocalWorkoutPlan(planInput);
    let coachSummary = "Programme sportif personnalisé selon ton profil.";

    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const sessionsCount = planInput.mode === "extreme" ? 5 : planInput.mode === "strict" ? 4 : 3;
        const res = await fetch(DEEPSEEK_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
          body: JSON.stringify({
            model: "deepseek-chat", max_tokens: 3000, stream: false, temperature: 0.4,
            messages: [
              {
                role: "system",
                content: `Tu es un coach fitness expert. Réponds UNIQUEMENT avec un JSON valide (sans markdown):
{"coachSummary":"résumé en 1 phrase","sessions":[{"day_index":1,"session_name":"Push","exercises":[{"name":"Développé couché","sets":4,"reps":"8-10","rest":90}]}]}
Règles: day_index = jour JS (0=dimanche, 1=lundi … 6=samedi). Exactement ${sessionsCount} séances/semaine adaptées à l'équipement. 4 à 6 exercices par séance. Noms en français.`,
              },
              {
                role: "user",
                content: `Profil: ${body.name}, ${body.sex === "f" ? "femme" : "homme"}, ${body.age} ans, ${body.weight_kg}kg, ${body.height_cm}cm. Objectif: ${body.goal}. Mode: ${body.mode}. Équipement: ${planInput.equipment.join(", ")}. Régime: ${(body.diet_constraints ?? []).filter((x: string) => x !== "Aucune").join(", ") || "aucune contrainte"}.`,
              },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
          const text = data.choices?.[0]?.message?.content ?? "";
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const ai = JSON.parse(match[0]) as { coachSummary?: string; sessions?: unknown };
            sessions = sanitizeAiSessions(ai.sessions, planInput);
            coachSummary = ai.coachSummary ?? coachSummary;
          }
        }
      } catch {
        coachSummary = "Programme généré localement (IA temporairement indisponible).";
      }
    }

    return NextResponse.json({
      success: true, data: {
        macros, weeklyChange: body.goal === "gain" ? 0.5 : body.goal === "loss" ? -0.4 : 0,
        sessionsPerWeek: sessions.length,
        coachSummary, sessions, notes: "",
      },
    });
  } catch { return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 }); }
}
