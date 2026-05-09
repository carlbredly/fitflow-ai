import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Check, Clock, Dumbbell, Pause, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { todayWorkout, weekDays } from "@/lib/mock";

export const Route = createFileRoute("/workout")({
  head: () => ({ meta: [
    { title: "Workout — FitAI" },
    { name: "description", content: "Programme et séances personnalisés." },
  ]}),
  component: Workout,
});

function Workout() {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>(
    Object.fromEntries(todayWorkout.exercises.map((e) => [e.id, e.done]))
  );

  return (
    <AppShell header={<PageHeader title="Workout" subtitle="Semaine 3 / 6 · Mode Strict" />}>
      {/* Week */}
      <div className="-mx-4 mb-4 overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-2">
          {weekDays.map((d, i) => {
            const isToday = d.today;
            return (
              <button key={i}
                className="flex w-14 shrink-0 flex-col items-center gap-1 rounded-2xl border p-2 transition"
                style={{
                  borderColor: isToday ? "var(--accent)" : "var(--border)",
                  background: isToday ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "var(--surface-1)",
                }}>
                <span className="text-[10px] font-medium text-muted-foreground">{d.d}</span>
                <span className="font-mono text-base font-bold">{d.date}</span>
                {d.done ? (
                  <span className="grid h-4 w-4 place-items-center rounded-full grad-accent">
                    <Check className="h-2.5 w-2.5 text-background" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: isToday ? "var(--accent)" : "var(--surface-3)" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today hero */}
      <section className="overflow-hidden rounded-3xl border border-border grad-hero p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Aujourd'hui</p>
        <h2 className="mt-1 text-2xl font-bold">{todayWorkout.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
            <Clock className="h-3 w-3" /> ~{todayWorkout.duration} min
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
            <Dumbbell className="h-3 w-3" /> {todayWorkout.total} exercices
          </span>
        </div>
        <button
          onClick={() => setActive(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">
          <Play className="h-4 w-4" /> Démarrer la séance
        </button>
      </section>

      {/* Exercise list */}
      <ul className="mt-4 space-y-2">
        {todayWorkout.exercises.map((ex, i) => {
          const isDone = done[ex.id];
          return (
            <li key={ex.id}>
              <button
                onClick={() => setDone((d) => ({ ...d, [ex.id]: !d[ex.id] }))}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-1 p-3 text-left transition hover:border-accent/40">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.sets} × {ex.reps} reps · repos {ex.rest}s</p>
                </div>
                <span
                  className="grid h-7 w-7 place-items-center rounded-full border transition"
                  style={{
                    background: isDone ? "var(--accent)" : "transparent",
                    borderColor: isDone ? "var(--accent)" : "var(--border)",
                  }}>
                  {isDone && <Check className="h-4 w-4 text-background" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {active && <ActiveWorkout onClose={() => setActive(false)} />}
    </AppShell>
  );
}

function ActiveWorkout({ onClose }: { onClose: () => void }) {
  const [idx, setIdx] = useState(4);
  const [seconds, setSeconds] = useState(72);
  const ex = todayWorkout.exercises[idx];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
      <header className="flex items-center justify-between p-4">
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"><X className="h-4 w-4" /></button>
        <span className="text-xs font-medium text-muted-foreground">Exercice {idx + 1} / {todayWorkout.exercises.length}</span>
        <div className="w-9" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Repos</p>
        <p className="mt-3 font-mono text-7xl font-bold tabular" style={{ color: "var(--accent)" }}>
          {String(Math.floor(seconds / 60)).padStart(1, "0")}:{String(seconds % 60).padStart(2, "0")}
        </p>
        <h2 className="mt-10 text-2xl font-bold">{ex.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Série 2/{ex.sets} · {ex.reps} répétitions</p>

        <div className="mt-8 flex gap-1.5">
          {todayWorkout.exercises.map((_, i) => (
            <span key={i} className="h-1.5 w-6 rounded-full" style={{ background: i <= idx ? "var(--accent)" : "var(--surface-3)" }} />
          ))}
        </div>
      </div>

      <div className="space-y-3 p-4 safe-bottom">
        <button className="w-full rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">
          Valider la série
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} className="flex items-center justify-center gap-1 rounded-xl bg-surface-1 py-3 text-xs font-medium text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Préc.
          </button>
          <button onClick={() => setSeconds((s) => Math.max(0, s - 10))} className="flex items-center justify-center gap-1 rounded-xl bg-surface-1 py-3 text-xs font-medium">
            <Pause className="h-4 w-4" /> -10s
          </button>
          <button onClick={() => setIdx(Math.min(todayWorkout.exercises.length - 1, idx + 1))} className="flex items-center justify-center gap-1 rounded-xl bg-surface-1 py-3 text-xs font-medium text-muted-foreground">
            Suivant <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
