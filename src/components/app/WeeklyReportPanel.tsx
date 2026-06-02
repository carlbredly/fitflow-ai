"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { FileText, Loader2, Sparkles, RefreshCw } from "lucide-react";
import type { WeeklyReportData } from "@/hooks/useWeeklyReport";

export function WeeklyReportPanel({
  report,
  isGenerating,
  onGenerate,
  hasStats,
}: {
  report: WeeklyReportData | null;
  isGenerating: boolean;
  onGenerate: () => void;
  hasStats: boolean;
}) {
  const stats = report?.stats;
  const chartData = stats
    ? [
        { label: "Repas", value: stats.daysWithMeals, max: 7 },
        { label: "Kcal OK", value: stats.daysOnKcalTarget, max: 7 },
        { label: "Prot OK", value: stats.daysOnProteinTarget, max: 7 },
        { label: "Sport", value: stats.workoutsCompleted, max: Math.max(stats.workoutsScheduled, 3) },
      ]
    : [];

  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" style={{ color: "var(--accent)" }} />
          Rapport hebdomadaire
        </h2>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !hasStats}
          className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-medium hover:bg-surface-3 disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : report ? (
            <RefreshCw className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" style={{ color: "var(--accent)" }} />
          )}
          {report ? "Actualiser" : "Générer"}
        </button>
      </div>

      {!report && !isGenerating && (
        <p className="mt-3 text-xs text-muted-foreground text-center py-6">
          L&apos;IA analyse ta semaine et te livre un bilan visuel avec conseils personnalisés.
        </p>
      )}

      {isGenerating && (
        <div className="mt-4 flex flex-col items-center py-8 gap-2">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
          <p className="text-xs text-muted-foreground">Analyse en cours…</p>
        </div>
      )}

      {report && !isGenerating && stats && (
        <div className="mt-4 space-y-4 animate-slide-up">
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -24, right: 8, top: 4, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 7]} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}`, ""]}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-2">
              <p className="text-[10px] text-muted-foreground">Moy. kcal</p>
              <p className="font-mono text-lg font-bold">{stats.avgKcal}</p>
            </div>
            <div className="rounded-xl bg-surface-2 p-2">
              <p className="text-[10px] text-muted-foreground">Adhérence</p>
              <p className="font-mono text-lg font-bold" style={{ color: "var(--accent)" }}>{stats.adherenceScore}%</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed rounded-xl px-3 py-2.5" style={{ background: "color-mix(in oklab, var(--accent) 8%, transparent)" }}>
            {report.aiSummary}
          </p>

          {report.highlights.length > 0 && (
            <ul className="space-y-1">
              {report.highlights.map((h, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span style={{ color: "var(--accent)" }}>✓</span> {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
