"use client";

import { useRef, useCallback } from "react";
import { Share2, Download } from "lucide-react";
import type { WeekStats } from "@/lib/gamification";

export function ShareProgressCard({
  name,
  stats,
  programDay,
}: {
  name: string;
  stats: WeekStats;
  programDay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const shareText = [
    `FitAI Coach — Ma semaine`,
    `🔥 Streak : ${stats.foodStreak} jours`,
    `💪 ${stats.workoutsCompleted} séance(s) complétée(s)`,
    `📊 Adhérence : ${stats.adherenceScore}%`,
    stats.weightChange != null ? `⚖️ ${stats.weightChange > 0 ? "+" : ""}${stats.weightChange} kg` : null,
    programDay ? `📅 Jour ${programDay} du programme` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const drawCardToCanvas = useCallback(async (): Promise<Blob | null> => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, "#0d0d0d");
    grad.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = "#00E5A0";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillText("FitAI Coach", 32, 52);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.fillText(`Semaine de ${name}`, 32, 92);

    ctx.fillStyle = "#a3a3a3";
    ctx.font = "16px system-ui, sans-serif";
    const lines = [
      `Streak repas : ${stats.foodStreak} jours`,
      `Séances : ${stats.workoutsCompleted}/${stats.workoutsScheduled || "—"}`,
      `Adhérence : ${stats.adherenceScore}%`,
      `Moy. calories : ${stats.avgKcal} kcal/j`,
      stats.weightChange != null ? `Poids : ${stats.weightChange > 0 ? "+" : ""}${stats.weightChange} kg` : "",
    ].filter(Boolean);
    lines.forEach((line, i) => ctx.fillText(line, 32, 130 + i * 36));

    ctx.fillStyle = "#00E5A0";
    ctx.fillRect(32, 340, 120, 6);

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }, [name, stats]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const blob = await drawCardToCanvas();
        if (blob && navigator.canShare?.({ files: [new File([blob], "fitai-semaine.png", { type: "image/png" })] })) {
          await navigator.share({
            title: "Ma progression FitAI",
            text: shareText,
            files: [new File([blob], "fitai-semaine.png", { type: "image/png" })],
          });
          return;
        }
        await navigator.share({ title: "Ma progression FitAI", text: shareText });
        return;
      } catch { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Résumé copié dans le presse-papiers !");
    } catch {
      alert(shareText);
    }
  };

  const handleDownload = async () => {
    const blob = await drawCardToCanvas();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitai-semaine-${stats.weekStart}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-border bg-surface-1 p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Share2 className="h-4 w-4" style={{ color: "var(--accent)" }} />
        Partager ma progression
      </h2>

      <div
        ref={cardRef}
        className="rounded-2xl grad-hero border border-border p-4 text-left"
      >
        <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>FitAI Coach</p>
        <p className="mt-1 text-lg font-bold">Semaine de {name}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>🔥 Streak : <span className="text-foreground font-mono">{stats.foodStreak}</span> jours</li>
          <li>💪 Séances : <span className="text-foreground font-mono">{stats.workoutsCompleted}</span></li>
          <li>📊 Adhérence : <span className="text-foreground font-mono">{stats.adherenceScore}%</span></li>
          {stats.weightChange != null && (
            <li>⚖️ Poids : <span className="text-foreground font-mono">{stats.weightChange > 0 ? "+" : ""}{stats.weightChange} kg</span></li>
          )}
        </ul>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold grad-accent text-background"
        >
          <Share2 className="h-4 w-4" /> Partager
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 py-2.5 text-sm font-medium"
        >
          <Download className="h-4 w-4" /> Image PNG
        </button>
      </div>
    </section>
  );
}
