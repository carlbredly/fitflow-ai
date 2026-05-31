import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Home,
  Dumbbell,
  Cable,
  Weight,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { generatePlan } from "@/lib/ai-service";
import { useAuth } from "@/hooks/useAuth";

import type {
  OnboardingData,
  GeneratedPlan,
} from "@/lib/ai-service";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      {
        title: "Onboarding — FitAI",
      },
      {
        name: "description",
        content: "Crée ton plan personnalisé en 4 étapes.",
      },
    ],
  }),
  component: Onboarding,
});

const TOTAL = 4;

function Onboarding() {
  const handleSkip = async () => {
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        name: user?.email?.split("@")[0] ?? "Utilisateur",
        goal: "maintain", mode: "normal", deadline_weeks: 8,
        program_start_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>);
    }
    navigate({ to: "/" });
  };

  const userId = user?.id;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [plan, setPlan] = useState<GeneratedPlan | null>(null);

  const [form, setForm] = useState<OnboardingData>({
    name: "",
    sex: "m",
    age: 0,
    weight: 0,
    height: 0,
    goalWeight: 0,
    dietConstraints: ["Aucune"],
    goal: "gain",
    mode: "normal",
    weeks: 4,
    equipment: ["home"],
  });

  const update = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const next = () => {
    if (step < TOTAL - 1) {
      setStep((prev) => prev + 1);
    }
  };

  const prev = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const canContinue =
    form.name.trim() !== "" &&
    form.age > 0 &&
    form.height > 0 &&
    form.weight > 0 &&
    form.goalWeight > 0;

  const handleFinish = async () => {
    if (!userId) {
      navigate({ to: "/" });
      return;
    }

    setSaving(true);

    try {
      const now = new Date().toISOString();
      const today = now.split("T")[0];

      await supabase.from("profiles").upsert({
        id: userId,
        name: form.name,
        sex: form.sex,
        age: form.age,
        weight_kg: form.weight,
        height_cm: form.height,
        goal_weight_kg: form.goalWeight,
        diet_constraints: form.dietConstraints.filter(
          (d) => d !== "Aucune"
        ),
        goal: form.goal,
        mode: form.mode,
        deadline_weeks: form.weeks,
        equipment: form.equipment,
        program_start_date: today,
        updated_at: now,
      });

      if (plan?.sessions.length) {
        const refDate = new Date();
        refDate.setHours(0, 0, 0, 0);

        const sessions = plan.sessions.map((s) => {
          const sessionDate = new Date(refDate);
          let delta = (s.day_index - refDate.getDay() + 7) % 7;
          if (delta === 0) delta = 7;
          sessionDate.setDate(refDate.getDate() + delta);

          return {
            user_id: userId,
            session_date: sessionDate.toISOString().split("T")[0],
            session_name: s.session_name,
            day_index: s.day_index,
            exercises: s.exercises,
            duration_minutes: Math.round(
              s.exercises.reduce(
                (sum, e) => sum + (e.rest / 60) * e.sets + 0.75 * e.sets,
                0,
              ),
            ) + 5,
          };
        });

        await supabase
          .from("workout_sessions")
          .insert(sessions);
      }

      navigate({ to: "/" });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  background:
                    i <= step
                      ? "var(--accent)"
                      : "var(--surface-3)",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-muted-foreground"
          >
            Skip
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-32">
        {step === 0 && (
          <Step1 form={form} update={update} />
        )}

        {step === 1 && (
          <Step2 form={form} update={update} />
        )}

        {step === 2 && (
          <Step3 form={form} update={update} />
        )}

        {step === 3 && (
          <Step4
            form={form}
            onFinish={handleFinish}
            saving={saving}
            setPlan={setPlan}
          />
        )}
      </main>

      {step < 3 && (
        <div className="fixed inset-x-0 bottom-0 z-30 glass border-t border-border safe-bottom">
          <div className="mx-auto max-w-2xl p-4">
            <button
              type="button"
              onClick={next}
              disabled={step === 0 && !canContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold grad-accent text-background disabled:opacity-50"
            >
              {step === 2
                ? "Générer mon plan ✨"
                : "Continuer"}

              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Title({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="mb-6 animate-slide-up">
      <h1 className="text-3xl font-bold leading-tight">
        {children}
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        {sub}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}

function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-surface-1 px-4 py-3 text-sm outline-none transition focus:border-accent ${
        props.className ?? ""
      }`}
    />
  );
}

function Step1({
  form,
  update,
}: {
  form: OnboardingData;
  update: <K extends keyof OnboardingData>(
    k: K,
    v: OnboardingData[K]
  ) => void;
}) {
  const tags = [
    "Aucune",
    "Végétarien",
    "Vegan",
    "Sans gluten",
    "Sans lactose",
    "Halal",
    "Allergie noix",
  ];

  const toggle = (tag: string) => {
    if (tag === "Aucune") {
      update("dietConstraints", ["Aucune"]);
      return;
    }

    const picked = form.dietConstraints.includes(tag)
      ? form.dietConstraints.filter((x) => x !== tag)
      : [
          ...form.dietConstraints.filter(
            (d) => d !== "Aucune"
          ),
          tag,
        ];

    update(
      "dietConstraints",
      picked.length ? picked : ["Aucune"]
    );
  };

  return (
    <>
      <Title sub="Pour calculer tes besoins exacts">
        Parle-nous de toi
      </Title>

      <div className="space-y-4">
        <Field label="Prénom">
          <Input
            placeholder="Alex"
            value={form.name}
            onChange={(e) =>
              update("name", e.target.value)
            }
          />
        </Field>

        <Field label="Sexe">
          <div className="grid grid-cols-2 gap-2">
            {(["m", "f"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("sex", s)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3.5 text-sm font-medium transition"
                style={{
                  borderColor:
                    form.sex === s
                      ? "var(--accent)"
                      : "var(--border)",
                }}
              >
                <span>
                  {s === "m" ? "👨" : "👩"}
                </span>

                {s === "m"
                  ? "Homme"
                  : "Femme"}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Âge">
            <Input
              type="number"
              value={form.age || ""}
              onChange={(e) =>
                update(
                  "age",
                  e.target.value === ""
                    ? 0
                    : parseInt(e.target.value)
                )
              }
            />
          </Field>

          <Field label="Taille (cm)">
            <Input
              type="number"
              value={form.height || ""}
              onChange={(e) =>
                update(
                  "height",
                  e.target.value === ""
                    ? 0
                    : parseFloat(e.target.value)
                )
              }
            />
          </Field>

          <Field label="Poids actuel (kg)">
            <Input
              type="number"
              step={0.1}
              value={form.weight || ""}
              onChange={(e) =>
                update(
                  "weight",
                  e.target.value === ""
                    ? 0
                    : parseFloat(e.target.value)
                )
              }
            />
          </Field>

          <Field label="Poids objectif (kg)">
            <Input
              type="number"
              step={0.1}
              value={form.goalWeight || ""}
              onChange={(e) =>
                update(
                  "goalWeight",
                  e.target.value === ""
                    ? 0
                    : parseFloat(e.target.value)
                )
              }
            />
          </Field>
        </div>

        <Field label="Régimes & allergies">
          <div className="-mx-4 overflow-x-auto no-scrollbar px-4">
            <div className="flex gap-2 pb-1">
              {tags.map((t) => {
                const on =
                  form.dietConstraints.includes(t);

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggle(t)}
                    className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
                  >
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

/* ---------- STEP 2 ---------- */

function Step2({
  form,
  update,
}: {
  form: OnboardingData;
  update: <K extends keyof OnboardingData>(
    k: K,
    v: OnboardingData[K]
  ) => void;
}) {
  return (
    <>
      <Title sub="Choisis ton objectif">
        Ton objectif
      </Title>

      <div className="space-y-3">
        {[
          {
            id: "gain",
            label: "Prise de masse",
          },
          {
            id: "loss",
            label: "Perte de poids",
          },
          {
            id: "maintain",
            label: "Maintien",
          },
        ].map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() =>
              update(
                "goal",
                goal.id as OnboardingData["goal"]
              )
            }
            className="w-full rounded-2xl border border-border p-4 text-left"
          >
            {goal.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------- STEP 3 ---------- */

function Step3({
  form,
  update,
}: {
  form: OnboardingData;
  update: <K extends keyof OnboardingData>(
    k: K,
    v: OnboardingData[K]
  ) => void;
}) {
  const items = [
    {
      id: "home",
      Icon: Home,
      label: "Maison",
    },
    {
      id: "gym",
      Icon: Dumbbell,
      label: "Salle",
    },
    {
      id: "bands",
      Icon: Cable,
      label: "Élastiques",
    },
    {
      id: "weights",
      Icon: Weight,
      label: "Haltères",
    },
  ];

  const toggle = (id: string) => {
    const picked = form.equipment.includes(id)
      ? form.equipment.filter((x) => x !== id)
      : [...form.equipment, id];

    update(
      "equipment",
      picked.length ? picked : ["home"]
    );
  };

  return (
    <>
      <Title sub="Choisis ton équipement">
        Programme
      </Title>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const on =
            form.equipment.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border p-5"
            >
              <item.Icon className="h-7 w-7" />

              <span>{item.label}</span>

              {on && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------- STEP 4 ---------- */

function Step4({
  form,
  onFinish,
  saving,
  setPlan,
}: {
  form: OnboardingData;
  onFinish: () => void;
  saving: boolean;
  setPlan: (p: GeneratedPlan) => void;
}) {
  const [plan, setLocalPlan] =
    useState<GeneratedPlan | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [status, setStatus] = useState(
    "Analyse de ton profil..."
  );

  const savePlan = (p: GeneratedPlan) => {
    setLocalPlan(p);
    setPlan(p);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setError(null); setLoading(true);
      try {
        await new Promise((r) =>
          setTimeout(r, 600)
        );

        if (!mounted) return;

        setStatus(
          "Calcul de tes besoins caloriques..."
        );

        await new Promise((r) =>
          setTimeout(r, 500)
        );

        if (!mounted) return;

        setStatus(
          "Génération de ton programme..."
        );

        const result = await generatePlan(form);

        if (!mounted) return;

        savePlan(result);
      } catch (error) {
        console.error(error);
        setError("Impossible de contacter l'IA. Vérifie ta connexion.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="grid h-16 w-16 place-items-center rounded-full grad-accent">
          <Sparkles className="h-8 w-8" />
        </div>

        <p className="mt-6 text-sm">
          {status}
        </p>
      </div>
    );
  }

  if (!plan || error) {
    const retry = () => { setError(null); setLoading(true); run(); };
    return (
      <div className="text-center space-y-4">
        <p className="text-destructive text-sm">{error ?? "Erreur lors de la génération."}</p>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={retry} className="rounded-xl px-6 py-2.5 text-sm font-semibold grad-accent text-background">
            Réessayer
          </button>
          <button type="button" onClick={onFinish} className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground">
            Continuer sans plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">
          Ton plan est prêt 🎯
        </h1>

        <p className="mt-2 text-muted-foreground">
          Voici tes besoins quotidiens
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">
            Calories
          </p>

          <p className="mt-1 text-2xl font-bold">
            {plan.macros.kcal}
          </p>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">
            Protéines
          </p>

          <p className="mt-1 text-2xl font-bold">
            {plan.macros.protein}g
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onFinish}
        disabled={saving}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold grad-accent text-background disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Check className="h-5 w-5" />
        )}

        {saving
          ? "Sauvegarde..."
          : "C'est parti !"}
      </button>
    </>
  );
}