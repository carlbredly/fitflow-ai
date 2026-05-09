import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Flame, Camera, Plus, Droplet, Scale, ChevronRight, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { CalorieRing } from "@/components/app/CalorieRing";
import { MacroBar } from "@/components/app/MacroBar";
import { profile, today, recentMeals, todayWorkout } from "@/lib/mock";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FitAI Coach — Dashboard" },
    { name: "description", content: "Ton coach IA fitness & nutrition personnalisé." },
  ]}),
  component: Home,
});

const modeLabel = { normal: ["🟢", "Normal"], strict: ["🟠", "Strict"], extreme: ["🔴", "Poussé"] } as const;

function Header() {
  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full grad-accent text-sm font-bold text-background">
            {profile.name[0]}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bonjour</p>
            <p className="text-sm font-semibold leading-none">{profile.name} 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium" style={{ color: "var(--orange)" }}>
            <Flame className="h-3.5 w-3.5" /> {profile.streak}
          </span>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Home() {
  const [emoji, label] = modeLabel[profile.mode];
  return (
    <AppShell header={<Header />}>
      {/* Hero */}
      <section className="animate-slide-up overflow-hidden rounded-3xl border border-border grad-hero p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium" style={{ color: "var(--orange)" }}>
            {emoji} {label}
          </span>
          <span className="font-mono text-xs text-muted-foreground">J{profile.day} / J{profile.totalDays}</span>
        </div>
        <div className="mt-4 grid place-items-center">
          <CalorieRing value={today.kcal} goal={profile.targetKcal} />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <MacroBar label="Prot" value={today.protein} goal={profile.targetProtein} />
          <MacroBar label="Gluc" value={today.carbs} goal={profile.targetCarbs} color="var(--info)" />
          <MacroBar label="Lip" value={today.fat} goal={profile.targetFat} color="var(--orange)" />
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-4 -mx-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4">
          {[
            { Icon: Camera, label: "Scanner", to: "/nutrition" },
            { Icon: Plus, label: "Ajouter", to: "/nutrition" },
            { Icon: Droplet, label: "Eau", to: "/" },
            { Icon: Scale, label: "Poids", to: "/progress" },
          ].map(({ Icon, label, to }) => (
            <Link key={label} to={to}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition">
              <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Today workout */}
      <Link to="/workout" className="mt-4 block animate-slide-up">
        <div className="rounded-2xl border border-border bg-surface-1 p-4 transition hover:border-accent/40">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Séance du jour</p>
              <h3 className="mt-1 text-lg font-semibold">💪 {todayWorkout.name}</h3>
              <p className="text-xs text-muted-foreground">~{todayWorkout.duration} min · {todayWorkout.total} exercices</p>
            </div>
            <ChevronRight className="text-muted-foreground" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full grad-accent" style={{ width: `${(todayWorkout.done / todayWorkout.total) * 100}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground">{todayWorkout.done}/{todayWorkout.total}</span>
          </div>
        </div>
      </Link>

      {/* Recent meals */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Derniers repas</h2>
          <Link to="/nutrition" className="text-xs font-medium" style={{ color: "var(--accent)" }}>
            Voir tout →
          </Link>
        </div>
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface-1 divide-y divide-border">
          {recentMeals.map((m) => (
            <li key={m.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-base">{m.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.time}</p>
                </div>
              </div>
              <span className="rounded-full px-2.5 py-1 text-xs font-mono font-semibold"
                style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
                {m.kcal} kcal
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Progress preview */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface-1 p-4">
          <p className="text-xs text-muted-foreground">Poids actuel</p>
          <p className="mt-1 font-mono text-2xl font-bold">{profile.weight}<span className="text-sm text-muted-foreground"> kg</span></p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full grad-accent" style={{ width: "62%" }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Objectif {profile.goalWeight} kg</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-1 p-4">
          <p className="text-xs text-muted-foreground">Jours restants</p>
          <p className="mt-1 font-mono text-2xl font-bold">{profile.totalDays - profile.day}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-1 text-xs"
            style={{ color: "var(--accent)" }}>
            <CheckCircle2 className="h-3 w-3" /> Sur la bonne voie
          </div>
        </div>
      </section>
    </AppShell>
  );
}
