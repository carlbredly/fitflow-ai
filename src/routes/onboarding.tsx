import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback, memo } from "react";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, Home, Dumbbell, Cable, Weight, Loader2, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generatePlan, generateLocalFallback } from "@/lib/ai-service";
import { useAuth } from "@/hooks/useAuth";
import type { OnboardingData, GeneratedPlan } from "@/lib/ai-service";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — FitAI" }] }),
  component: Onboarding,
});

const TOTAL = 4;

function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [form, setForm] = useState<OnboardingData>({
    name: "", sex: "m", age: 0, weight: 0, height: 0, goalWeight: 0,
    dietConstraints: [], goal: "gain", mode: "normal", weeks: 4, equipment: [],
  });

  const formRef = useRef(form);
  formRef.current = form;

  const update = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const prev = useCallback(() => setStep((p) => Math.max(0, p - 1)), []);

  const next = useCallback(async () => {
    if (step !== 2) { setStep((p) => Math.min(p + 1, TOTAL - 1)); return; }
    if (generating) return;
    setGenerating(true);
    setGenError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const currentForm = formRef.current;

    try {
      const result = await generatePlan(currentForm, controller.signal);
      setPlan(result);
      setStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      if (msg === "Génération annulée") {
        setGenError("Génération annulée");
      } else {
        const fallback = generateLocalFallback(currentForm);
        setPlan(fallback);
        setGenError("Plan calculé localement (l'IA était indisponible)");
        setStep(3);
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [step, generating]);

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSkip = useCallback(async () => {
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId, name: user?.email?.split("@")[0] ?? "Utilisateur",
        goal: "maintain", mode: "normal", deadline_weeks: 8,
        program_start_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>);
    }
    navigate({ to: "/" });
  }, [userId, user, navigate]);

  const canContinue = form.name.trim() !== "" && form.age > 0 && form.height > 0 && form.weight > 0 && form.goalWeight > 0;

  const handleFinish = useCallback(async () => {
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
        equipment: form.equipment, program_start_date: today, updated_at: now,
      } as Record<string, unknown>);
      if (plan?.sessions.length) {
        const refDate = new Date(); refDate.setHours(0, 0, 0, 0);
        const sessions = plan.sessions.map((s) => {
          const sessionDate = new Date(refDate);
          let delta = (s.day_index - refDate.getDay() + 7) % 7;
          if (delta === 0) delta = 7;
          sessionDate.setDate(refDate.getDate() + delta);
          return {
            user_id: userId, session_date: sessionDate.toISOString().split("T")[0],
            session_name: s.session_name, day_index: s.day_index,
            exercises: s.exercises,
            duration_minutes: Math.round(s.exercises.reduce((sum, e) => sum + (e.rest / 60) * e.sets + 0.75 * e.sets, 0)) + 5,
          };
        });
        await supabase.from("workout_sessions").insert(sessions);
      }
      navigate({ to: "/" });
    } catch (error) { console.error("Save error:", error); }
    finally { setSaving(false); }
  }, [userId, form, plan, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button type="button" onClick={prev} disabled={step === 0 || step === 3} className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all"
                style={{ width: i === step ? 24 : 8, background: i <= step ? "var(--accent)" : "var(--surface-3)" }} />
            ))}
          </div>
          <button type="button" onClick={handleSkip} className="text-xs text-muted-foreground">Skip</button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-32">
        {step === 0 && <Step1 form={form} update={update} />}
        {step === 1 && <Step2 form={form} update={update} />}
        {step === 2 && <Step3 form={form} update={update} />}
        {step === 3 && <Step4 form={form} plan={plan} genError={genError} onFinish={handleFinish} saving={saving} />}
      </main>

      {step < 3 && (
        <div className="fixed inset-x-0 bottom-0 z-30 glass border-t border-border safe-bottom">
          <div className="mx-auto max-w-2xl p-4 space-y-2">
            <button type="button" onClick={generating ? cancelGeneration : next}
              disabled={step === 0 && !canContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition disabled:opacity-50"
              style={{ background: generating ? "var(--surface-3)" : undefined, color: generating ? "var(--foreground)" : undefined }}>
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Annuler</>
              ) : (
                <>{step === 2 ? "Générer mon plan ✨" : "Continuer"} <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition focus:border-accent ${props.className ?? ""}`} />;
}

const Step1 = memo(function Step1({ form, update }: { form: OnboardingData; update: (k: keyof OnboardingData, v: any) => void }) {
  const tags = ["Aucune", "Végétarien", "Vegan", "Sans gluten", "Sans lactose", "Halal", "Allergie noix"];
  const toggle = (tag: string) => {
    if (tag === "Aucune") { update("dietConstraints", ["Aucune"]); return; }
    const picked = form.dietConstraints.includes(tag)
      ? form.dietConstraints.filter((x) => x !== tag)
      : [...form.dietConstraints.filter((d) => d !== "Aucune"), tag];
    update("dietConstraints", picked.length ? picked : ["Aucune"]);
  };
  return (
    <div className="animate-slide-up space-y-4">
      <h1 className="text-3xl font-bold leading-tight">Parle-nous de toi</h1>
      <p className="text-sm text-muted-foreground">Pour calculer tes besoins exacts</p>
      <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Prénom</span>
        <SimpleInput placeholder="Alex" value={form.name} onChange={(e) => update("name", e.target.value)} />
      </label>
      <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Sexe</span>
        <div className="grid grid-cols-2 gap-2">
          {(["m", "f"] as const).map((s) => (
            <button key={s} type="button" onClick={() => update("sex", s)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3.5 text-sm font-medium transition"
              style={{ borderColor: form.sex === s ? "var(--accent)" : "var(--border)", background: form.sex === s ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--surface-1)" }}>
              <span>{s === "m" ? "👨" : "👩"}</span> {s === "m" ? "Homme" : "Femme"}
            </button>
          ))}
        </div>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Âge</span>
          <SimpleInput type="number" value={form.age || ""} onChange={(e) => update("age", e.target.value === "" ? 0 : parseInt(e.target.value))} />
        </label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Taille (cm)</span>
          <SimpleInput type="number" value={form.height || ""} onChange={(e) => update("height", e.target.value === "" ? 0 : parseFloat(e.target.value))} />
        </label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Poids (kg)</span>
          <SimpleInput type="number" step={0.1} value={form.weight || ""} onChange={(e) => update("weight", e.target.value === "" ? 0 : parseFloat(e.target.value))} />
        </label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Poids objectif (kg)</span>
          <SimpleInput type="number" step={0.1} value={form.goalWeight || ""} onChange={(e) => update("goalWeight", e.target.value === "" ? 0 : parseFloat(e.target.value))} />
        </label>
      </div>
      <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Régimes & allergies</span>
        <div className="-mx-4 overflow-x-auto no-scrollbar px-4">
          <div className="flex gap-2 pb-1">
            {tags.map((t) => {
              const on = form.dietConstraints.includes(t);
              return (<button key={t} type="button" onClick={() => toggle(t)}
                className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
                style={{ borderColor: on ? "var(--accent)" : "var(--border)", background: on ? "var(--accent)" : "var(--surface-1)", color: on ? "var(--accent-foreground)" : "var(--foreground)" }}>{t}</button>);
            })}
          </div>
        </div>
      </label>
    </div>
  );
});

const Step2 = memo(function Step2({ form, update }: { form: OnboardingData; update: (k: keyof OnboardingData, v: any) => void }) {
  return (
    <div className="animate-slide-up space-y-4">
      <h1 className="text-3xl font-bold leading-tight">Ton objectif</h1>
      <p className="text-sm text-muted-foreground">Choisis ton objectif et ton intensité</p>
      {[
        { id: "gain" as const, emoji: "💪", title: "Prise de masse", sub: "+200 à +500 kcal" },
        { id: "loss" as const, emoji: "🔥", title: "Perte de poids", sub: "-400 kcal · déficit" },
        { id: "maintain" as const, emoji: "⚖️", title: "Maintien", sub: "Maintenance" },
      ].map((g) => {
        const on = form.goal === g.id;
        return (<button key={g.id} type="button" onClick={() => update("goal", g.id)}
          className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-2 p-4 text-left transition"
          style={{ borderColor: on ? "var(--accent)" : "var(--border)", background: on ? "color-mix(in oklab, var(--accent) 10%, var(--surface-1))" : "var(--surface-1)" }}>
          {on && <span className="absolute left-0 top-0 h-full w-1 grad-accent" />}
          <span className="text-2xl">{g.emoji}</span>
          <div className="flex-1"><p className="text-sm font-semibold">{g.title}</p><p className="text-xs text-muted-foreground">{g.sub}</p></div>
        </button>);
      })}
    </div>
  );
});

const Step3 = memo(function Step3({ form, update }: { form: OnboardingData; update: (k: keyof OnboardingData, v: any) => void }) {
  const items = [{ id: "home", Icon: Home, label: "Maison" }, { id: "gym", Icon: Dumbbell, label: "Salle" }, { id: "bands", Icon: Cable, label: "Élastiques" }, { id: "weights", Icon: Weight, label: "Haltères" }];
  const toggle = (id: string) => {
    const picked = form.equipment.includes(id) ? form.equipment.filter((x) => x !== id) : [...form.equipment, id];
    update("equipment", picked.length ? picked : ["home"]);
  };
  return (
    <div className="animate-slide-up space-y-4">
      <h1 className="text-3xl font-bold leading-tight">Ton programme</h1>
      <p className="text-sm text-muted-foreground">Choisis ton équipement</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const on = form.equipment.includes(item.id);
          return (<button key={item.id} type="button" onClick={() => toggle(item.id)}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition"
            style={{ borderColor: on ? "var(--accent)" : "var(--border)", background: on ? "color-mix(in oklab, var(--accent) 10%, var(--surface-1))" : "var(--surface-1)" }}>
            <item.Icon className="h-7 w-7" style={{ color: on ? "var(--accent)" : "var(--muted-foreground)" }} />
            <span className="text-sm font-medium">{item.label}</span>
            {on && <Check className="h-4 w-4" style={{ color: "var(--accent)" }} />}
          </button>);
        })}
      </div>
    </div>
  );
});

function Step4({ form, plan, genError, onFinish, saving }: {
  form: OnboardingData; plan: GeneratedPlan | null; genError: string | null; onFinish: () => void; saving: boolean;
}) {
  if (!plan) return null;
  return (
    <div className="animate-slide-up text-center space-y-4">
      <h1 className="text-3xl font-bold">Ton plan est prêt, {form.name || "Sportif"} 🎯</h1>
      {genError && <p className="text-sm" style={{ color: "var(--warning)" }}><AlertTriangle className="inline h-3 w-3 mr-1" />{genError}</p>}
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 no-scrollbar">
        {[
          { label: "Calories", value: plan.macros.kcal.toLocaleString(), unit: "kcal", color: "var(--accent)" },
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
      <button type="button" onClick={onFinish} disabled={saving}
        className="w-full rounded-xl py-4 text-base font-semibold grad-accent text-background disabled:opacity-50">
        {saving ? <Loader2 className="h-5 w-5 animate-spin inline" /> : <Check className="h-5 w-5 inline" />}
        {saving ? " Sauvegarde..." : " C'est parti !"}
      </button>
    </div>
  );
}
