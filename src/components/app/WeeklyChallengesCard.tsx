"use client";

import { Target } from "lucide-react";
import type { ChallengeProgress } from "@/lib/gamification";

export function WeeklyChallengesCard({
  challenges,
  adherenceScore,
}: {
  challenges: ChallengeProgress[];
  adherenceScore: number;
}) {
  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: "var(--accent)" }} />
          Défis de la semaine
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {completedCount}/{challenges.length}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full grad-accent transition-all" style={{ width: `${adherenceScore}%` }} />
        </div>
        <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>
          {adherenceScore}%
        </span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Score d&apos;adhérence global</p>
      <ul className="mt-3 space-y-2">
        {challenges.map(({ challenge, current, completed, progressPct }) => (
          <li key={challenge.id} className="rounded-xl bg-surface-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{challenge.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{challenge.title}</p>
                  <p className="text-[10px] text-muted-foreground">{challenge.description}</p>
                </div>
              </div>
              <span
                className="shrink-0 text-xs font-mono font-semibold"
                style={{ color: completed ? "var(--accent)" : "var(--muted-foreground)" }}
              >
                {current}/{challenge.target}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPct}%`,
                  background: completed ? "var(--accent)" : "var(--orange)",
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
