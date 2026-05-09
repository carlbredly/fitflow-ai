import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Sparkles, Home, Dumbbell, Cable, Weight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [
    { title: "Onboarding — FitAI" },
    { name: "description", content: "Crée ton plan personnalisé en 4 étapes." },
  ]}),
  component: Onboarding,
});

const TOTAL = 4;

function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const next = () => (step < TOTAL - 1 ? setStep(step + 1) : navigate({ to: "/" }));
  const prev = () => setStep(Math.max(0, step - 1));

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
        {step === 0 && <Step1 />}
        {step === 1 && <Step2 />}
        {step === 2 && <Step3 />}
        {step === 3 && <Step4 onFinish={() => navigate({ to: "/" })} />}
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

function Step1() {
  const [sex, setSex] = useState<"m" | "f">("m");
  const tags = ["Aucune", "Végétarien", "Vegan", "Sans gluten", "Sans lactose", "Halal", "Allergie noix"];
  const [picked, setPicked] = useState<string[]>(["Aucune"]);
  const toggle = (t: string) => setPicked((p) => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  return (
    <>
      <Title sub="Pour calculer tes besoins exacts">Parle-nous de toi</Title>
      <div className="space-y-4">
        <Field label="Prénom"><Input placeholder="Alex" defaultValue="Alex" /></Field>

        <Field label="Sexe">
          <div className="grid grid-cols-2 gap-2">
            {(["m", "f"] as const).map((s) => (
              <button key={s} onClick={() => setSex(s)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3.5 text-sm font-medium transition"
                style={{
                  borderColor: sex === s ? "var(--accent)" : "var(--border)",
                  background: sex === s ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--surface-1)",
                }}>
                <span>{s === "m" ? "👨" : "👩"}</span> {s === "m" ? "Homme" : "Femme"}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Âge"><Input type="number" defaultValue={28} /></Field>
          <Field label="Taille (cm)"><Input type="number" defaultValue={180} /></Field>
          <Field label="Poids actuel (kg)"><Input type="number" defaultValue={78.4} /></Field>
          <Field label="Poids objectif (kg)"><Input type="number" defaultValue={82} /></Field>
        </div>

        <Field label="Régimes & allergies">
          <div className="-mx-4 overflow-x-auto no-scrollbar px-4">
            <div className="flex gap-2 pb-1">
              {tags.map((t) => {
                const on = picked.includes(t);
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

function Step2() {
  const [goal, setGoal] = useState("gain");
  const [mode, setMode] = useState("strict");
  const goals = [
    { id: "gain", emoji: "💪", title: "Prise de masse", sub: "+200 à +500 kcal · surplus" },
    { id: "loss", emoji: "🔥", title: "Perte de poids", sub: "-400 kcal · déficit progressif" },
    { id: "maintain", emoji: "⚖️", title: "Maintien / Recomposition", sub: "Maintenance · ratio macro opt." },
  ];
  const modes = [
    { id: "normal", emoji: "🟢", label: "Débutant", title: "Normal", k: "+200 kcal", p: "1.6g/kg", s: "3x/sem", color: "var(--success)" },
    { id: "strict", emoji: "🟠", label: "Intermédiaire", title: "Strict", k: "+300 kcal", p: "1.8g/kg", s: "4x/sem", color: "var(--orange)" },
    { id: "extreme", emoji: "🔴", label: "Avancé", title: "Poussé", k: "+500 kcal", p: "2.2g/kg", s: "5-6x/sem", color: "var(--danger)" },
  ];

  return (
    <>
      <Title sub="Choisis ton objectif et ton intensité">Ton objectif</Title>

      <div className="space-y-2">
        {goals.map((g) => {
          const on = goal === g.id;
          return (
            <button key={g.id} onClick={() => setGoal(g.id)}
              className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-2 p-4 text-left transition"
              style={{
                borderColor: on ? "var(--accent)" : "var(--border)",
                background: on ? "color-mix(in oklab, var(--accent) 10%, var(--surface-1))" : "var(--surface-1)",
              }}>
              {on && <span className="absolute left-0 top-0 h-full w-1 grad-accent" />}
              <span className="text-2xl">{g.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{g.title}</p>
                <p className="text-xs text-muted-foreground">{g.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold">Mode d'entraînement</h2>
      <div className="space-y-2">
        {modes.map((m) => {
          const on = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="block w-full rounded-2xl border-2 p-4 text-left transition"
              style={{
                borderColor: on ? "var(--accent)" : "var(--border)",
                background: on ? "color-mix(in oklab, var(--accent) 10%, var(--surface-1))" : "var(--surface-1)",
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{m.emoji}</span>
                  <span className="text-sm font-semibold">{m.title}</span>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: `color-mix(in oklab, ${m.color} 18%, transparent)`, color: m.color }}>
                  {m.label}
                </span>
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

function Step3() {
  const [weeks, setWeeks] = useState(6);
  const [equip, setEquip] = useState<string[]>(["gym"]);
  const items = [
    { id: "home", Icon: Home, label: "Maison" },
    { id: "gym", Icon: Dumbbell, label: "Salle" },
    { id: "bands", Icon: Cable, label: "Élastiques" },
    { id: "weights", Icon: Weight, label: "Haltères" },
  ];
  const toggle = (id: string) => setEquip((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const endDate = new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000)
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Title sub="Définis la durée et ton équipement">Ton programme</Title>

      <section className="rounded-2xl border border-border bg-surface-1 p-5">
        <p className="text-xs font-medium text-muted-foreground">Durée du programme</p>
        <p className="mt-2 text-center font-display text-5xl font-bold" style={{ color: "var(--accent)" }}>
          {weeks} <span className="text-xl text-muted-foreground">sem</span>
        </p>
        <input type="range" min={1} max={24} value={weeks} onChange={(e) => setWeeks(+e.target.value)}
          className="mt-4 w-full accent-[color:var(--accent)]" />
        <p className="mt-2 text-center text-xs text-muted-foreground">Fin estimée : {endDate}</p>

        <div className="mt-4 rounded-xl bg-surface-2 p-3">
          <p className="text-xs text-muted-foreground">Objectif hebdomadaire</p>
          <p className="mt-1 text-sm font-semibold">+0.5 kg / semaine ≈ +{(weeks * 0.5).toFixed(1)} kg</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full grad-accent" style={{ width: "60%" }} />
          </div>
        </div>
      </section>

      <h2 className="mb-3 mt-6 text-sm font-semibold">Équipement disponible</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const on = equip.includes(it.id);
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

function Step4({ onFinish }: { onFinish: () => void }) {
  const macros = [
    { label: "Calories", value: "2,340", unit: "kcal", color: "var(--accent)" },
    { label: "Protéines", value: "165", unit: "g", color: "var(--info)" },
    { label: "Glucides", value: "290", unit: "g", color: "var(--orange)" },
    { label: "Lipides", value: "72", unit: "g", color: "var(--warning)" },
  ];
  return (
    <>
      <div className="mb-6 animate-slide-up">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full grad-accent text-background animate-pulse-glow">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-center text-3xl font-bold">Ton plan est prêt, Alex 🎯</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Voici tes besoins quotidiens calculés par l'IA</p>
      </div>

      <div className="-mx-4 overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-3">
          {macros.map((m) => (
            <div key={m.label} className="w-36 shrink-0 rounded-2xl border border-border bg-surface-1 p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 font-mono text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.unit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full grad-accent text-background"><Sparkles className="h-3.5 w-3.5" /></span>
          <span className="text-xs font-semibold">Coach FitAI</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Avec ton mode <span className="font-semibold text-foreground">Strict</span> et ton objectif de prise de masse,
          on vise <span className="font-semibold text-foreground">+0.5 kg/semaine</span>.
          Priorise les protéines à chaque repas et garde 4 séances de musculation par semaine. Je te suis quotidiennement 💪
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <p className="text-xs text-muted-foreground">Progression estimée</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-lg font-bold">78.4 kg</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>82 kg</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full grad-accent" style={{ width: "5%" }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Semaine 1 / 6</p>
      </div>

      <button onClick={onFinish}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold grad-accent text-background">
        <Check className="h-5 w-5" /> C'est parti !
      </button>
    </>
  );
}
