import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, Sparkles, Edit3 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { profile } from "@/lib/mock";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [
    { title: "Profil — FitAI" },
    { name: "description", content: "Tes informations et préférences." },
  ]}),
  component: Profile,
});

function Profile() {
  return (
    <AppShell header={<PageHeader title="Profil" right={<button className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"><Settings className="h-4 w-4 text-muted-foreground" /></button>} />}>
      {/* Identity */}
      <section className="rounded-3xl border border-border grad-hero p-5 text-center">
        <div className="relative mx-auto h-20 w-20">
          <div className="grid h-full w-full place-items-center rounded-full grad-accent text-3xl font-bold text-background">
            {profile.name[0]}
          </div>
          <button className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-surface-2 border border-border">
            <Edit3 className="h-3 w-3" />
          </button>
        </div>
        <h2 className="mt-3 text-xl font-bold">{profile.name}</h2>
        <p className="text-xs text-muted-foreground">Mode Strict · Semaine 3</p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface-2 p-2.5">
            <p className="font-mono text-base font-bold">{profile.weight}</p>
            <p className="text-[10px] text-muted-foreground">kg actuel</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-2.5">
            <p className="font-mono text-base font-bold" style={{ color: "var(--accent)" }}>{profile.goalWeight}</p>
            <p className="text-[10px] text-muted-foreground">kg objectif</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-2.5">
            <p className="font-mono text-base font-bold" style={{ color: "var(--orange)" }}>🔥 {profile.streak}</p>
            <p className="text-[10px] text-muted-foreground">streak</p>
          </div>
        </div>
      </section>

      {/* Onboarding link */}
      <Link to="/onboarding"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-1 p-4 transition hover:border-accent/40">
        <span className="grid h-10 w-10 place-items-center rounded-xl grad-accent text-background">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Refaire l'onboarding</p>
          <p className="text-xs text-muted-foreground">Recalcule ton plan et tes macros</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Targets */}
      <section className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <h3 className="text-sm font-semibold">Mes cibles quotidiennes</h3>
        <ul className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Calories</span><span className="font-mono">{profile.targetKcal}</span></li>
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Protéines</span><span className="font-mono">{profile.targetProtein}g</span></li>
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Glucides</span><span className="font-mono">{profile.targetCarbs}g</span></li>
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Lipides</span><span className="font-mono">{profile.targetFat}g</span></li>
        </ul>
      </section>

      {/* Settings list */}
      <ul className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-1 divide-y divide-border">
        {[
          { Icon: Bell, label: "Notifications" },
          { Icon: Shield, label: "Confidentialité" },
          { Icon: HelpCircle, label: "Aide & support" },
        ].map((it) => (
          <li key={it.label}>
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2">
              <it.Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{it.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-1 py-3.5 text-sm font-medium text-destructive">
        <LogOut className="h-4 w-4" /> Se déconnecter
      </button>
    </AppShell>
  );
}
