import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingDown, Flame, Dumbbell, Scale } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { weightHistory, kcalWeek, profile } from "@/lib/mock";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [
    { title: "Progress — FitAI" },
    { name: "description", content: "Suivi de ta progression et de tes statistiques." },
  ]}),
  component: Progress,
});

function Progress() {
  return (
    <AppShell header={<PageHeader title="Progress" subtitle="Tes statistiques · 6 dernières semaines" />}>
      {/* Weight chart */}
      <section className="rounded-2xl border border-border bg-surface-1 p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Poids actuel</p>
            <p className="font-mono text-3xl font-bold">{profile.weight}<span className="ml-1 text-sm text-muted-foreground">kg</span></p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-mono"
            style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
            <TrendingDown className="h-3 w-3" /> -1.8 kg
          </span>
        </div>
        <div className="mt-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightHistory} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="w" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--surface-3)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis domain={[77, 83]} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <ReferenceLine y={profile.goalWeight} stroke="var(--orange)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="w" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--accent)" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" placeholder={String(profile.weight)} className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent" />
          <button className="rounded-xl px-4 py-2.5 text-sm font-semibold grad-accent text-background">Enregistrer</button>
        </div>
      </section>

      {/* Calories week */}
      <section className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <h3 className="text-sm font-semibold">Calories — 7 derniers jours</h3>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kcalWeek} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="var(--surface-3)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                cursor={{ fill: "var(--surface-3)", opacity: 0.4 }}
                contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              />
              <ReferenceLine y={profile.targetKcal} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <Bar dataKey="kcal" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Stats grid */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        {[
          { Icon: Flame, label: "Moy. kcal", value: "2,294", sub: "/ 2,340 cible", color: "var(--orange)" },
          { Icon: Dumbbell, label: "Séances", value: "14", sub: "ce mois-ci", color: "var(--accent)" },
          { Icon: Scale, label: "Δ Poids", value: "-1.8", sub: "kg en 6 sem", color: "var(--info)" },
          { Icon: Flame, label: "Streak", value: "12", sub: "jours d'affilée", color: "var(--orange)" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface-1 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <s.Icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* History */}
      <section className="mt-4">
        <h3 className="mb-2 text-sm font-semibold">Historique</h3>
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface-1 divide-y divide-border">
          {kcalWeek.slice().reverse().map((d) => {
            const pct = Math.min((d.kcal / d.goal) * 100, 120);
            const ok = d.kcal <= d.goal * 1.05;
            return (
              <li key={d.d} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{d.d}</span>
                  <span className="font-mono text-xs text-muted-foreground">{d.kcal} / {d.goal} kcal</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: ok ? "var(--accent)" : "var(--orange)" }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
