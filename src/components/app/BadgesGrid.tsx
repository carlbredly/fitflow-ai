"use client";

import { Award } from "lucide-react";
import type { BadgeDefinition } from "@/lib/gamification";

export function BadgesGrid({
  badges,
  compact = false,
}: {
  badges: Array<BadgeDefinition & { unlocked: boolean }>;
  compact?: boolean;
}) {
  const unlocked = badges.filter((b) => b.unlocked);

  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: "var(--accent)" }} />
          Badges
        </h2>
        <span className="text-xs text-muted-foreground">
          {unlocked.length} débloqués
        </span>
      </div>
      {unlocked.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Continue ton parcours pour débloquer des badges
        </p>
      ) : (
        <div className={`grid gap-3 ${compact ? "grid-cols-5" : "grid-cols-4"}`}>
          {unlocked.map((badge) => (
            <div
              key={badge.id}
              title={`${badge.title} — ${badge.description}`}
              className="group flex flex-col items-center rounded-xl bg-surface-2 p-2 text-center transition-all duration-300 hover:bg-surface-2/80"
            >
              <div className="relative w-full drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">
                <img
                  src={badge.svgPath}
                  alt={badge.title}
                  className="w-full h-auto transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              {!compact && (
                <p className="mt-1.5 text-[10px] font-semibold leading-tight line-clamp-2 text-foreground/80">
                  {badge.title}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
