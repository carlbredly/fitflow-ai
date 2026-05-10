import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Play, Check, Clock, Dumbbell, Pause, ChevronLeft, ChevronRight, X, Sparkles, Loader2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

interface Exercise { id: number; name: string; sets: number; reps: string; rest: number; done: boolean; }
interface WorkoutData { name: string; duration: number; total: number; exercises: Exercise[]; sessionId?: string; }

const FALLBACK: WorkoutData = {
  name: "Full Body", duration: 45, total: 6,
  exercises: [
    { id: 1, name: "Développé couché", sets: 4, reps: "8-10", rest: 90, done: false },
    { id: 2, name: "Squat barre", sets: 4, reps: "8-10", rest: 90, done: false },
    { id: 3, name: "Tractions", sets: 3, reps: "8-12", rest: 75, done: false },
    { id: 4, name: "Développé militaire", sets: 3, reps: "10-12", rest: 75, done: false },
    { id: 5, name: "Soulevé de terre", sets: 3, reps: "8-10", rest: 90, done: false },
    { id: 6, name: "Planche abdominale", sets: 3, reps: "45s", rest: 60, done: false },
  ],
};

function getWeekDays() {
  const days = ["D", "L", "M", "M", "J", "V", "S"];
  const today = new Date(); const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    return { d: days[(d.getDay() + 6) % 7], date: d.getDate(), today: d.toDateString() === today.toDateString() };
  });
}

export const Route = createFileRoute("/workout")({
  head: () => ({ meta: [{ title: "Workout — FitAI" }] }),
  component: Workout,
});

function Workout() {
  const { user } = useAuth();
  const userId = user?.id;
  const { profile: dbProfile } = useProfile(userId);
  const [workout, setWorkout] = useState<WorkoutData>(FALLBACK);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useState<string | undefined>(undefined);
  const weekDays = getWeekDays();

  useEffect(() => {
    if (!userId) return;

    // 1. Try to load today's session from Supabase (saved by onboarding)
    const today = new Date().toISOString().split("T")[0]!;
    setLoading(true);

    supabase.from("workout_sessions").select("*").eq("user_id", userId).eq("session_date", today).single().then(({ data }) => {
      const s = data as Record<string, unknown> | null;
      if (s) {
        const exs = (s.exercises as Array<{ name: string; sets: number; reps: string; rest: number; done?: boolean }>) ?? [];
        const sessionId = s.id as string;
        sessionIdRef[1](sessionId);
        setWorkout({
          name: (s.session_name as string) ?? "Séance",
          duration: (s.duration_minutes as number) ?? 45,
          total: exs.length,
          exercises: exs.map((e, i) => ({ id: i + 1, ...e, done: e.done ?? false })),
          sessionId,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    setDone(Object.fromEntries(workout.exercises.map((e) => [e.id, e.done])));
  }, [workout]);

  const toggleDone = async (exId: number) => {
    const newDone = { ...done, [exId]: !done[exId] };
    setDone(newDone);

    // Persist to Supabase
    const sessionId = sessionIdRef[0];
    if (sessionId) {
      const updatedExercises = workout.exercises.map((e) =>
        e.id === exId ? { name: e.name, sets: e.sets, reps: e.reps, rest: e.rest, done: !done[exId] } : { name: e.name, sets: e.sets, reps: e.reps, rest: e.rest, done: done[e.id] }
      );
      await supabase.from("workout_sessions").update({
        exercises: updatedExercises,
        completed: Object.values(newDone).every(Boolean),
      } as Record<string, unknown>).eq("id", sessionId);
    }
  };

  const doneCount = Object.values(done).filter(Boolean).length;

  if (!user) {
    return (<AppShell header={<PageHeader title="Workout" subtitle="Connecte-toi" />}><div className="flex flex-col items-center justify-center py-20 gap-3"><Sparkles className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Connecte-toi pour ton programme</p></div></AppShell>);
  }

  return (
    <AppShell header={<PageHeader title="Workout" subtitle={`${workout.name} · ${workout.duration} min`} />}>
      {loading && (
        <div className="mb-3 rounded-xl px-3 py-2 text-xs font-medium animate-pulse" style={{ background: "color-mix(in oklab, var(--accent) 12%, transparent)", color: "var(--accent)" }}>
          <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />Chargement de ta séance...
        </div>
      )}
      <div className="-mx-4 mb-4 overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-2">
          {weekDays.map((d, i) => (
            <button key={i} className="flex w-14 shrink-0 flex-col items-center gap-1 rounded-2xl border p-2 transition"
              style={{ borderColor: d.today ? "var(--accent)" : "var(--border)", background: d.today ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "var(--surface-1)" }}>
              <span className="text-[10px] font-medium text-muted-foreground">{d.d}</span>
              <span className="font-mono text-base font-bold">{d.date}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.today ? "var(--accent)" : "var(--surface-3)" }} />
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border grad-hero p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Aujourd'hui</p>
        <h2 className="mt-1 text-2xl font-bold">{workout.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium"><Clock className="h-3 w-3" /> ~{workout.duration} min</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-medium"><Dumbbell className="h-3 w-3" /> {workout.total} exercices</span>
          {doneCount > 0 && <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: "color-mix(in oklab, var(--accent) 15%, transparent)", color: "var(--accent)" }}>{doneCount}/{workout.total} faits</span>}
        </div>
        <button onClick={() => setActive(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">
          <Play className="h-4 w-4" /> {doneCount > 0 ? "Continuer la séance" : "Démarrer la séance"}
        </button>
      </section>

      <ul className="mt-4 space-y-2">
        {workout.exercises.map((ex, i) => {
          const isDone = done[ex.id];
          return (
            <li key={ex.id}>
              <button onClick={() => toggleDone(ex.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-1 p-3 text-left transition hover:border-accent/40">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1 min-w-0"><p className="truncate text-sm font-semibold">{ex.name}</p><p className="text-xs text-muted-foreground">{ex.sets} × {ex.reps} reps · repos {ex.rest}s</p></div>
                <span className="grid h-7 w-7 place-items-center rounded-full border transition" style={{ background: isDone ? "var(--accent)" : "transparent", borderColor: isDone ? "var(--accent)" : "var(--border)" }}>
                  {isDone && <Check className="h-4 w-4 text-background" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {active && <ActiveWorkout exercises={workout.exercises} onClose={() => setActive(false)} />}
    </AppShell>
  );
}

function ActiveWorkout({ exercises, onClose }: { exercises: Exercise[]; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [seconds, setSeconds] = useState(90);
  const ex = exercises[idx] ?? exercises[0];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-slide-up">
      <header className="flex items-center justify-between p-4">
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"><X className="h-4 w-4" /></button>
        <span className="text-xs font-medium text-muted-foreground">Exercice {idx + 1} / {exercises.length}</span>
        <div className="w-9" />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Repos</p>
        <p className="mt-3 font-mono text-7xl font-bold tabular" style={{ color: "var(--accent)" }}>{String(Math.floor(seconds / 60)).padStart(1, "0")}:{String(seconds % 60).padStart(2, "0")}</p>
        <h2 className="mt-10 text-2xl font-bold">{ex.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Série 2/{ex.sets} · {ex.reps} répétitions</p>
        <div className="mt-8 flex gap-1.5">{exercises.map((_, i) => (<span key={i} className="h-1.5 w-6 rounded-full" style={{ background: i <= idx ? "var(--accent)" : "var(--surface-3)" }} />))}</div>
      </div>
      <div className="space-y-3 p-4 safe-bottom">
        <button className="w-full rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">Valider la série</button>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} className="flex items-center justify-center gap-1 rounded-xl bg-surface-1 py-3 text-xs font-medium text-muted-foreground"><ChevronLeft className="h-4 w-4" /> Préc.</button>
          <button onClick={() => setSeconds((s) => Math.max(0, s - 10))} className="flex items-center justify-center gap-1 rounded-xl bg-surface-1 py-3 text-xs font-medium"><Pause className="h-4 w-4" /> -10s</button>
          <button onClick={() => setIdx(Math.min(exercises.length - 1, idx + 1))} className="flex items-center justify-center gap-1 rounded-xl bg-surface-1 py-3 text-xs font-medium text-muted-foreground">Suivant <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
