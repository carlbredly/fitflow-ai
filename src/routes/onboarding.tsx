import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Sparkles, Home, Dumbbell, Cable, Weight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generatePlan } from "@/lib/ai-service";
import { useAuth } from "@/hooks/useAuth";
import type { OnboardingData, GeneratedPlan } from "@/lib/ai-service";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [
    { title: "Onboarding — FitAI" },
    { name: "description", content: "Crée ton plan personnalisé en 4 étapes." },
  ]}),
  component: Onboarding,
});

const TOTAL = 4;

function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<OnboardingData>({
    name: "",
    sex: "m",
    age: 0,
    weight: 0,
    height: 0,
    goalWeight: 0,
    dietConstraints: [],
    goal: "gain",
    mode: "normal",
    weeks: 4,
    equipment: [],
  });

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const next = () => (step < TOTAL - 1 ? setStep(step + 1) : null);
  const prev = () => setStep(Math.max(0, step - 1));

  const [plan, setPlan] = useState<GeneratedPlan | null>(null);

  const handleFinish = async () => {
    if (!userId) { navigate({ to: "/" }); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const today = now.split("T")[0]!;
      await supabase.from("profiles").upsert({
        id: userId, name: form.name, sex: form.sex, age: form.age,
        weight_kg: form.weight, height_cm: form.height,
        goal_weight_kg: form.goalWeight,
        diet_constraints: form.dietConstraints.filter((d) => d !== "Aucune"),
        goal: form.goal, mode: form.mode, deadline_weeks: form.weeks,
        equipment: form.equipment,
        program_start_date: today,
        updated_at: now,
      });

      // Save workout program to Supabase
      if (plan?.sessions.length) {
        for (const s of plan.sessions) {
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() + ((s.day_index - sessionDate.getDay() + 7) % 7));
          await supabase.from("workout_sessions").insert({
            user_id: userId, session_date: sessionDate.toISOString().split("T")[0],
            session_name: s.session_name, day_index: s.day_index,
            exercises: s.exercises, duration_minutes: s.exercises.reduce((sum, e) => sum + Math.round(e.rest / 60) * e.sets, 5) + 5,
          } as Record<string, unknown>);
        }
      }
    } catch (err) { console.error("Save error:", err); }
    finally { setSaving(false); navigate({ to: "/" }); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button onClick={prev} disabled={step === 0}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 disabled:opacity-30">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  background: i <= step ? "var(--accent)" : "var(--surface-3)",
                }} />
            ))}
          </div>
          <Link to="/" className="text-xs text-muted-foreground">Skip</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-32">
        {step === 0 && <Step1 form={form} update={update} />}
        {step === 1 && <Step2 form={form} update={update} />}
        {step === 2 && <Step3 form={form} update={update} />}
        {step === 3 && <Step4 form={form} onFinish={handleFinish} saving={saving} setPlan={setPlan} />}
      </main>

      {step < 3 && (
        <div className="fixed inset-x-0 bottom-0 z-30 glass border-t border-border safe-bottom">
          <div className="mx-auto max-w-2xl p-4">
            <button onClick={next}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">
              {step === 2 ? "Générer mon plan ✨" : "Continuer"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Title({ children, sub }: { children: React.ReactNode; sub: string }) {
  return (
    <div className="mb-6 animate-slide-up">
      <h1 className="text-3xl font-bold leading-tight">{children}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"w-full rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition focus:border-accent " + (props.className ?? "")} />;
}

function Step1({ form, update }: { form: OnboardingData; update: (k: keyof OnboardingData, v: any) => void }) {
  const tags = ["Aucune", "Végétarien", "Vegan", "Sans gluten", "Sans lactose", "Halal", "Allergie noix"];
  const toggle = (t: string) => {
    if (t === "Aucune") { update("dietConstraints", ["Aucune"]); return; }
    const picked = form.dietConstraints.includes(t)
      ? form.dietConstraints.filter((x) => x !== t)
      : [...form.dietConstraints.filter((d) => d !== "Aucune"), t];
    update("dietConstraints", picked.length === 0 ? ["Aucune"] : picked);
  };

  return (
    <>
      <Title sub="Pour calculer tes besoins exacts">Parle-nous de toi</Title>
      <div className="space-y-4">
        <Field label="Prénom">
          <Input placeholder="Alex" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label="Sexe">
          <div className="grid grid-cols-2 gap-2">
            {(["m", "f"] as const).map((s) => (
              <button key={s} onClick={() => update("sex", s)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3.5 text-sm font-medium transition"
                style={{
                  borderColor: form.sex === s ? "var(--accent)" : "var(--border)",
                  background: form.sex === s ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--surface-1)",
                }}>
                <span>{s === "m" ? "👨" : "👩"}</span> {s === "m" ? "Homme" : "Femme"}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Âge"><Input type="number" placeholder="28" value={form.age || ""} onChange={(e) => update("age", +e.target.value)} /></Field>
          <Field label="Taille (cm)"><Input type="number" placeholder="180" value={form.height || ""} onChange={(e) => update("height", +e.target.value)} /></Field>
          <Field label="Poids actuel (kg)"><Input type="number" placeholder="78" step={0.1} value={form.weight || ""} onChange={(e) => update("weight", +e.target.value)} /></Field>
          <Field label="Poids objectif (kg)"><Input type="number" placeholder="82" step={0.1} value={form.goalWeight || ""} onChange={(e) => update("goalWeight", +e.target.value)} /></Field>
        </div>
        <Field label="Régimes & allergies">
          <div className="-mx-4 overflow-x-auto no-scrollbar px-4">
            <div className="flex gap-2 pb-1">
              {tags.map((t) => {
                const on = form.dietConstraints.includes(t);
                return (
                  <button key={t} onClick={() => toggle(t)}
                    className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
                    style={{
                      borderColor: on ? "var(--accent)" : "var(--border)",
                      background: on ? "var(--accent)" : "var(--surface-1)",
                      color: on ? "var(--accent-foreground)" : "var(--foreground)",
                    }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </Field>
      </div>
    </>
  );
}

function Step2({ form, update }: { form: OnboardingData; update: (k: keyof OnboardingData, v: any) => void }) {
  const goals = [
    { id: "gain" as const, emoji: "💪", title: "Prise de masse", sub: "+200 à +500 kcal · surplus" },
    { id: "loss" as const, emoji: "🔥", title: "Perte de poids", sub: "-400 kcal · déficit progressif" },
    { id: "maintain" as const, emoji: "⚖️", title: "Maintien / Recomposition", sub: "Maintenance · ratio macro opt." },
  ];
  const modes = [
    { id: "normal" as const, emoji: "🟢", label: "Débutant", title: "Normal", k: "+200 kcal", p: "1.6g/kg", s: "3x/sem", color: "var(--success)" },
    { id: "strict" as const, emoji: "🟠", label: "Intermédiaire", title: "Strict", k: "+300 kcal", p: "1.8g/kg", s: "4x/sem", color: "var(--orange)" },
    { id: "extreme" as const, emoji: "🔴", label: "Avancé", title: "Poussé", k: "+500 kcal", p: "2.2g/kg", s: "5-6x/sem", color: "var(--danger)" },
  ];

  return (
    <>
      <Title sub="Choisis ton objectif et ton intensité">Ton objectif</Title>
      <div className="space-y-2">
        {goals.map((g) => {
          const on = form.goal === g.id;
          return (
            <button key={g.id} onClick={() => update("goal", g.id)}
              className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-2 p-4 text-left transition"
              style={{
                borderColor: on ? "var(--accent)" : "var(--border)",
                background: on ? "color-mix(in oklab, var(--accent) 10%, var(--surface-1))" : "var(--surface-1)",
              }}>
              {on && <span className="absolute left-0 top-0 h-full w-1 grad-accent" />}
              <span className="text-2xl">{g.emoji}</span>
              <div className="flex-1"><p className="text-sm font-semibold">{g.title}</p><p className="text-xs text-muted-foreground">{g.sub}</p></div>
            </button>
          );
        })}
      </div>
      <h2 className="mb-3 mt-6 text-sm font-semibold">Mode d'entraînement</h2>
      <div className="space-y-2">
        {modes.map((m) => {
          const on = form.mode === m.id;
          return (
            <button key={m.id} onClick={() => update("mode", m.id)}
              className="block w-full rounded-2xl border-2 p-4 text-left transition"
              style={{
                borderColor: on ? "var(--accent)" : "var(--border)",
                background: on ? "color-mix(in oklab, var(--accent) 10%, var(--surface-1))" : "var(--surface-1)",
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span>{m.emoji}</span><span className="text-sm font-semibold">{m.title}</span></div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: `color-mix(in oklab, ${m.color} 18%, transparent)`, color: m.color }}>{m.label}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface-2 py-2"><p className="font-mono text-xs font-semibold">{m.k}</p><p className="text-[10px] text-muted-foreground">calories</p></div>
                <div className="rounded-lg bg-surface-2 py-2"><p className="font-mono text-xs font-semibold">{m.p}</p><p className="text-[10px] text-muted-foreground">protéines</p></div>
                <div className="rounded-lg bg-surface-2 py-2"><p className="font-mono text-xs font-semibold">{m.s}</p><p className="text-[10px] text-muted-foreground">séances</p></div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Step3({ form, update }: { form: OnboardingData; update: (k: keyof OnboardingData, v: any) => void }) {
  const items = [
    { id: "home", Icon: Home, label: "Maison" },
    { id: "gym", Icon: Dumbbell, label: "Salle" },
    { id: "bands", Icon: Cable, label: "Élastiques" },
    { id: "weights", Icon: Weight, label: "Haltères" },
  ];
  const toggle = (id: string) => {
    const picked = form.equipment.includes(id)
      ? form.equipment.filter((x) => x !== id)
      : [...form.equipment, id];
    update("equipment", picked.length === 0 ? ["home"] : picked);
  };
  const endDate = new Date(Date.now() + form.weeks * 7 * 24 * 3600 * 1000)
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Title sub="Définis la durée et ton équipement">Ton programme</Title>
      <section className="rounded-2xl border border-border bg-surface-1 p-5">
        <p className="text-xs font-medium text-muted-foreground">Durée du programme</p>
        <p className="mt-2 text-center font-display text-5xl font-bold" style={{ color: "var(--accent)" }}>
          {form.weeks} <span className="text-xl text-muted-foreground">sem</span>
        </p>
        <input type="range" min={1} max={24} value={form.weeks} onChange={(e) => update("weeks", +e.target.value)}
          className="mt-4 w-full accent-[color:var(--accent)]" />
        <p className="mt-2 text-center text-xs text-muted-foreground">Fin estimée : {endDate}</p>
        <div className="mt-4 rounded-xl bg-surface-2 p-3">
          <p className="text-xs text-muted-foreground">Objectif hebdomadaire</p>
          <p className="mt-1 text-sm font-semibold">~{form.goal === "gain" ? "+" : form.goal === "loss" ? "-" : ""}0.5 kg / semaine</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full grad-accent" style={{ width: "60%" }} /></div>
        </div>
      </section>
      <h2 className="mb-3 mt-6 text-sm font-semibold">Équipement disponible</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const on = form.equipment.includes(it.id);
          return (
            <button key={it.id} onClick={() => toggle(it.id)}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition"
              style={{
                borderColor: on ? "var(--accent)" : "var(--border)",
                background: on ? "color-mix(in oklab, var(--accent) 10%, var(--surface-1))" : "var(--surface-1)",
              }}>
              <it.Icon className="h-7 w-7" style={{ color: on ? "var(--accent)" : "var(--muted-foreground)" }} />
              <span className="text-sm font-medium">{it.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Step4({ form, onFinish, saving, setPlan }: { form: OnboardingData; onFinish: () => void; saving: boolean; setPlan: (p: GeneratedPlan) => void }) {
  const [plan, setLocalPlan] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Analyse de ton profil...");

  const savePlan = (p: GeneratedPlan) => { setLocalPlan(p); setPlan(p); };

  useState(() => {
    (async () => {
      await new Promise((r) => setTimeout(r, 600));
      setStatus("Calcul de tes besoins caloriques...");
      await new Promise((r) => setTimeout(r, 400));
      setStatus("Génération de ton programme sportif...");
      try {
        const result = await generatePlan(form);
        savePlan(result);
      } catch {
        const { calculateAll } = await import("@/lib/calculations");
        const macros = calculateAll(form.weight, form.height, form.age, form.sex, form.goal, form.mode);
        const weeklyMap = { gain: 0.5, loss: -0.4, maintain: 0 };
        savePlan({
          macros,
          weeklyChange: weeklyMap[form.goal],
          sessionsPerWeek: form.mode === "extreme" ? 5 : form.mode === "strict" ? 4 : 3,
          coachSummary: `Plan adapté à ton profil ${form.mode === "strict" ? "Strict" : form.mode} pour un objectif de ${form.goal === "gain" ? "prise de masse" : form.goal === "loss" ? "perte de poids" : "maintien"}.`,
          sessions: [],
        });
      } finally {
        setLoading(false);
      }
    })();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full grad-accent text-background animate-pulse-glow">
          <Sparkles className="h-8 w-8" />
        </div>
        <p className="mt-6 font-mono text-sm" style={{ color: "var(--accent)" }}>{status}</p>
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full grad-accent animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const formatKcal = (n: number) => n.toLocaleString();
  const targetDiff = form.goalWeight - form.weight;
  const diffLabel = targetDiff >= 0 ? `+${targetDiff.toFixed(1)}` : targetDiff.toFixed(1);

  return (
    <>
      <div className="mb-6 animate-slide-up">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full grad-accent text-background animate-pulse-glow">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-center text-3xl font-bold">Ton plan est prêt, {form.name} 🎯</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Voici tes besoins quotidiens calculés par l'IA</p>
      </div>

      <div className="-mx-4 overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-3">
          {[
            { label: "Calories", value: formatKcal(plan.macros.kcal), unit: "kcal", color: "var(--accent)" },
            { label: "Protéines", value: String(plan.macros.protein), unit: "g", color: "var(--info)" },
            { label: "Glucides", value: String(plan.macros.carbs), unit: "g", color: "var(--orange)" },
            { label: "Lipides", value: String(plan.macros.fat), unit: "g", color: "var(--warning)" },
          ].map((m) => (
            <div key={m.label} className="w-36 shrink-0 rounded-2xl border border-border bg-surface-1 p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 font-mono text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {plan.sessions.length > 0 && (
        <div className="mt-4 -mx-4 overflow-x-auto no-scrollbar px-4">
          <div className="flex gap-3">
            {plan.sessions.slice(0, 3).map((s) => (
              <div key={s.day_index} className="w-48 shrink-0 rounded-2xl border border-border bg-surface-1 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Jour {s.day_index}</p>
                <p className="mt-1 text-sm font-semibold">{s.session_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.exercises.length} exercices</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full grad-accent text-background"><Sparkles className="h-3.5 w-3.5" /></span>
          <span className="text-xs font-semibold">Coach FitAI</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.coachSummary}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <p className="text-xs text-muted-foreground">Progression estimée</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-lg font-bold">{form.weight} kg</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>{form.goalWeight} kg</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full grad-accent" style={{ width: `${Math.min(Math.abs(targetDiff) / Math.max(form.weight, 1) * 100, 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{diffLabel} kg · {form.weeks} semaines · ~{Math.abs(plan.weeklyChange).toFixed(1)} kg/sem</p>
      </div>

      <button onClick={onFinish} disabled={saving}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold grad-accent text-background disabled:opacity-50">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        {saving ? "Sauvegarde..." : "C'est parti !"}
      </button>
    </>
  );
}
