"use client";

import { Bell, Flame, Camera, Plus, Scale, ChevronRight, CheckCircle2, Sparkles, MessageCircle, Award } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { PageLoading } from "@/components/app/PageLoading";
import { CalorieRing } from "@/components/app/CalorieRing";
import { MacroBar } from "@/components/app/MacroBar";
import { WeeklyChallengesCard } from "@/components/app/WeeklyChallengesCard";
import { useDashboard } from "@/hooks/useDashboard";
import { useRecentLogs } from "@/hooks/useFoodLog";
import { useGamification } from "@/hooks/useGamification";
import { BADGES } from "@/lib/gamification";

const mealEmoji: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🥤" };

export default function Home() {
  const dash = useDashboard();
  const { profile, today, modeEmoji, modeLabel, todaySession, isLoading, userId } = dash;
  const { data: recentLogs } = useRecentLogs(userId, 3);
  const { challenges, adherenceScore, foodStreak, newBadgeIds, isLoading: gamificationLoading } = useGamification(
    userId,
    profile?.targetKcal ?? 2000,
    profile?.targetProtein ?? 150,
  );

  if (isLoading || !profile) {
    return <PageLoading title="Accueil" />;
  }

  const doneCount = todaySession?.exercises ? (Array.isArray(todaySession.exercises) ? (todaySession.exercises as Array<{ done?: boolean }>).filter((e) => e.done).length : 0) : 0;
  const totalEx = todaySession?.exercises ? (Array.isArray(todaySession.exercises) ? (todaySession.exercises as Array<unknown>).length : 0) : 0;

  return (
    <AppShell header={
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
            <Link href="/profile" className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium" style={{ color: "var(--orange)" }} title="Streak repas">
              <Flame className="h-3.5 w-3.5" /> {foodStreak || profile.streak}
            </Link>
            <Link href="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted-foreground hover:text-foreground" title="Notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>
    }>
      <section className="animate-slide-up overflow-hidden rounded-3xl border border-border grad-hero p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium" style={{ color: "var(--orange)" }}>
            {modeEmoji} {modeLabel}
          </span>
          <span className="font-mono text-xs text-muted-foreground">J{profile.day} / J{profile.totalDays}</span>
        </div>
        <div className="mt-4 grid place-items-center">
          <CalorieRing value={today.kcal} goal={profile.targetKcal} />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <MacroBar label="Prot" value={Math.round(today.protein)} goal={profile.targetProtein} />
          <MacroBar label="Gluc" value={Math.round(today.carbs)} goal={profile.targetCarbs} color="var(--info)" />
          <MacroBar label="Lip" value={Math.round(today.fat)} goal={profile.targetFat} color="var(--orange)" />
        </div>
      </section>

      {newBadgeIds.length > 0 && (
        <Link href="/profile" className="mt-4 flex items-center gap-3 rounded-2xl border border-accent/40 px-4 py-3 animate-slide-up" style={{ background: "color-mix(in oklab, var(--accent) 12%, transparent)" }}>
          <div className="flex -space-x-2">
            {newBadgeIds.slice(0, 3).map((id) => {
              const badge = BADGES.find((b) => b.id === id);
              return badge ? (
                <img key={id} src={badge.svgPath} alt={badge.title} className="h-8 w-8 drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
              ) : null;
            })}
          </div>
          <p className="text-sm font-medium">Nouveau badge débloqué ! Voir mes récompenses</p>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      {!gamificationLoading && challenges.length > 0 && (
        <div className="mt-4">
          <WeeklyChallengesCard challenges={challenges} adherenceScore={adherenceScore} />
        </div>
      )}

      <section className="mt-4 -mx-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4">
          {[
            { Icon: Camera, label: "Scanner", href: "/nutrition?tab=Scanner" },
            { Icon: Plus, label: "Ajouter", href: "/nutrition" },
            { Icon: MessageCircle, label: "Coach IA", href: "/chat" },
            { Icon: Scale, label: "Poids", href: "/progress" },
          ].map(({ Icon, label, href }) => (
            <Link key={label} href={href}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3 transition">
              <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {totalEx > 0 && (
        <Link href="/workout" className="mt-4 block animate-slide-up">
          <div className="rounded-2xl border border-border bg-surface-1 p-4 transition hover:border-accent/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Séance du jour</p>
                <h3 className="mt-1 text-lg font-semibold">💪 {todaySession?.session_name ?? "Workout"}</h3>
                <p className="text-xs text-muted-foreground">~{todaySession?.duration_minutes ?? "?"} min · {totalEx} exercices</p>
              </div>
              <ChevronRight className="text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full grad-accent" style={{ width: `${totalEx > 0 ? (doneCount / totalEx) * 100 : 0}%` }} />
              </div>
              <span className="font-mono text-xs text-muted-foreground">{doneCount}/{totalEx}</span>
            </div>
          </div>
        </Link>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Derniers repas</h2>
          <Link href="/nutrition" className="text-xs font-medium" style={{ color: "var(--accent)" }}>Voir tout →</Link>
        </div>
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface-1 divide-y divide-border">
          {(recentLogs ?? []).length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">Aucun repas enregistré aujourd&apos;hui</li>
          ) : (
            (recentLogs ?? []).slice(0, 3).map((m: any) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-base">
                    {mealEmoji[m.meal_type] ?? "🍽️"}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{m.food_name}</p>
                    <p className="text-xs text-muted-foreground">{m.logged_date?.slice(5) ?? ""}</p>
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-mono font-semibold"
                  style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
                  {m.kcal ?? 0} kcal
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface-1 p-4">
          <p className="text-xs text-muted-foreground">Poids actuel</p>
          <p className="mt-1 font-mono text-2xl font-bold">{profile.weight}<span className="text-sm text-muted-foreground"> kg</span></p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full grad-accent" style={{ width: `${Math.min((profile.goalWeight > profile.weight ? (profile.weight / profile.goalWeight) : (profile.goalWeight / profile.weight)) * 100, 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Objectif {profile.goalWeight} kg</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-1 p-4">
          <p className="text-xs text-muted-foreground">Jours restants</p>
          <p className="mt-1 font-mono text-2xl font-bold">{Math.max(profile.totalDays - profile.day, 0)}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-1 text-xs" style={{ color: "var(--accent)" }}>
            <CheckCircle2 className="h-3 w-3" /> Sur la bonne voie
          </div>
        </div>
      </section>
    </AppShell>
  );
}
