"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingDown, Flame, Dumbbell, Scale, Sparkles, ClipboardCheck, Loader2, Activity, BedDouble, Zap, Target, CheckCircle2, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { SegmentTabs } from "@/components/app/SegmentTabs";
import { PageLoading } from "@/components/app/PageLoading";
import { WeeklyReportPanel } from "@/components/app/WeeklyReportPanel";
import { ShareProgressCard } from "@/components/app/ShareProgressCard";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { useWeightLogs } from "@/hooks/useWorkout";
import { useWeeklyCalories } from "@/hooks/useFoodLog";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database.types";

const tabs = ["Stats", "Check-in"] as const;

export default function ProgressPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Stats");
  const [weightInput, setWeightInput] = useState("");
  const { profile: dbProfile, calculatedMacros } = useProfile(userId);
  const { weightHistory, logWeight, isLogging } = useWeightLogs(userId);
  const targetKcal = calculatedMacros?.kcal ?? 2000;
  const targetProtein = calculatedMacros?.protein ?? 150;
  const { data: kcalWeek = [] } = useWeeklyCalories(userId, targetKcal);
  const { stats: weekStats } = useGamification(userId, targetKcal, targetProtein);
  const { report, isGenerating, generate } = useWeeklyReport(userId, weekStats);

  const chartData = weightHistory.map((w) => ({ date: w.logged_date?.slice(5) ?? "", w: w.weight_kg }));
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight_kg : dbProfile?.weight_kg ?? 0;
  const firstWeight = weightHistory.length > 0 ? weightHistory[0].weight_kg : currentWeight;
  const weightDiff = (currentWeight - firstWeight).toFixed(1);
  const avgKcal = kcalWeek.length > 0 ? Math.round(kcalWeek.reduce((s, d) => s + d.kcal, 0) / kcalWeek.length) : 0;

  const handleLogWeight = async () => {
    const val = parseFloat(weightInput);
    if (!isNaN(val) && userId) { logWeight({ weight_kg: val }); setWeightInput(""); }
  };

  if (!user || !dbProfile) {
    return <PageLoading title="Progrès" />;
  }

  const weightTrend = parseFloat(weightDiff);
  const trendUp = weightTrend > 0;

  return (
    <AppShell header={<PageHeader title="Progrès" subtitle={tab === "Check-in" ? "Check-in hebdomadaire" : `${avgKcal} kcal/j en moyenne`} />}>
      <SegmentTabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        className="mb-4"
        renderLabel={(t) => (
          <>
            {t === "Check-in" && <ClipboardCheck className="inline h-3.5 w-3.5 mr-1" />}
            {t}
          </>
        )}
      />

      {tab === "Stats" && (
        <>
          <section className="rounded-2xl border border-border bg-surface-1 p-4">
            <div className="flex items-baseline justify-between">
              <div><p className="text-xs text-muted-foreground">Poids actuel</p><p className="font-mono text-3xl font-bold">{currentWeight}<span className="ml-1 text-sm text-muted-foreground">kg</span></p></div>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-mono" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: trendUp ? "var(--orange)" : "var(--accent)" }}>
                <TrendingDown className={`h-3 w-3 ${trendUp ? "rotate-180" : ""}`} /> {weightDiff} kg
              </span>
            </div>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
                  <defs><linearGradient id="weightGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="var(--surface-3)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  {dbProfile?.goal_weight_kg && <ReferenceLine y={dbProfile.goal_weight_kg} stroke="var(--orange)" strokeDasharray="4 4" />}
                  <Line type="monotone" dataKey="w" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--accent)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input type="number" step="0.1" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogWeight()} placeholder={String(currentWeight)} className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent" />
              <button onClick={handleLogWeight} disabled={isLogging} className="rounded-xl px-4 py-2.5 text-sm font-semibold grad-accent text-background">Enregistrer</button>
            </div>
          </section>
          <section className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
            <h3 className="text-sm font-semibold">Calories — 7 jours</h3>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kcalWeek} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--surface-3)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip cursor={{ fill: "var(--surface-3)", opacity: 0.4 }} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <ReferenceLine y={targetKcal} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                  <Bar dataKey="kcal" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="mt-4 space-y-4">
            <WeeklyReportPanel
              report={report}
              isGenerating={isGenerating}
              onGenerate={() => generate()}
              hasStats={!!weekStats}
            />
            {weekStats && (
              <ShareProgressCard
                name={dbProfile.name}
                stats={weekStats}
                programDay={
                  dbProfile.program_start_date
                    ? Math.floor((Date.now() - new Date(dbProfile.program_start_date).getTime()) / 86400000) + 1
                    : undefined
                }
              />
            )}
          </div>
        </>
      )}

      {tab === "Check-in" && <WeeklyCheckin userId={userId} dbProfile={dbProfile} targetKcal={targetKcal} />}
    </AppShell>
  );
}

function WeeklyCheckin({ userId, dbProfile, targetKcal }: { userId: string | undefined; dbProfile: Profile | null | undefined; targetKcal: number }) {
  const [weight, setWeight] = useState("");
  const [sleepScore, setSleepScore] = useState(7);
  const [fatigueScore, setFatigueScore] = useState(5);
  const [motivationScore, setMotivationScore] = useState(7);
  const [adherenceScore, setAdherenceScore] = useState(8);
  const [workoutPerf, setWorkoutPerf] = useState(6);
  const [caloriesAvg, setCaloriesAvg] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    kcal: number; protein: number; carbs: number; fat: number;
    cardioSessions: number; volumeAdjustment: number; deload: boolean;
    intensityModifier: number; restModifier: number; messages: string[];
  } | null>(null);
  const [error, setError] = useState("");

  const handleCheckin = async () => {
    if (!userId) return;
    setLoading(true); setError(""); setResult(null);

    try {
      const { data: prevData } = await supabase.from("weekly_checkins").select("weight").eq("user_id", userId).order("checkin_date", { ascending: false }).limit(1);
      const prev = (prevData ?? []) as Array<{ weight: number }>;
      const previousWeight = prev[0]?.weight ?? parseFloat(weight);
      const goal = dbProfile?.goal ?? "maintain";
      const currentKcal = caloriesAvg ? parseInt(caloriesAvg) : targetKcal;

      const weeklyChange = parseFloat(weight) - previousWeight;
      const expectedChange = goal === "loss" ? -0.5 : goal === "gain" ? 0.5 : 0;
      const kCalAdjust = Math.round((weeklyChange - expectedChange) * 500);
      const newKcal = Math.max(1200, currentKcal - kCalAdjust);
      const protein = Math.round((newKcal * 0.35) / 4);
      const carbs = Math.round((newKcal * 0.40) / 4);
      const fat = Math.round((newKcal * 0.25) / 9);

      const messages: string[] = [];
      if (Math.abs(weeklyChange - expectedChange) > 0.3) messages.push(`Ajustement calorique de ${kCalAdjust > 0 ? "+" : ""}${kCalAdjust} kcal basé sur ta progression.`);
      if (fatigueScore <= 3) { messages.push("Fatigue élevée — envisage une semaine de décharge."); }
      if (adherenceScore >= 8) { messages.push("Bonne adhérence ! Tu peux augmenter légèrement l'intensité."); }
      if (sleepScore <= 4) { messages.push("Sommeil insuffisant — priorise la récupération cette semaine."); }

      setResult({
        kcal: newKcal, protein, carbs, fat,
        cardioSessions: fatigueScore >= 7 ? 2 : 1,
        volumeAdjustment: adherenceScore >= 8 ? 5 : adherenceScore <= 3 ? -10 : 0,
        deload: fatigueScore <= 3,
        intensityModifier: fatigueScore >= 7 ? 5 : -5,
        restModifier: fatigueScore <= 3 ? 30 : 0,
        messages: messages.length > 0 ? messages : ["Bonne semaine ! Continue comme ça."],
      });

      await supabase.from("weekly_checkins").insert({
        user_id: userId, weight: parseFloat(weight),
        calories_avg: caloriesAvg ? parseInt(caloriesAvg) : null,
        adherence_score: adherenceScore, sleep_score: sleepScore,
        fatigue_score: fatigueScore, motivation_score: motivationScore,
        workout_performance_score: workoutPerf,
      } as Record<string, unknown>);
    } catch {
      setError("Erreur lors de l'enregistrement");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-1 p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><ClipboardCheck className="h-4 w-4" style={{ color: "var(--accent)" }} />Check-in hebdomadaire</h3>
        <p className="mt-1 text-xs text-muted-foreground">Remplis tes stats pour obtenir des ajustements personnalisés</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Poids actuel (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="78.4" className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Calories moyennes/jour cette semaine</label>
            <input type="number" value={caloriesAvg} onChange={(e) => setCaloriesAvg(e.target.value)} placeholder="2300" className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <SliderRow icon={BedDouble} label="Sommeil" value={sleepScore} onChange={setSleepScore} color="var(--info)" />
          <SliderRow icon={Activity} label="Fatigue" value={fatigueScore} onChange={setFatigueScore} color="var(--warning)" invert />
          <SliderRow icon={Zap} label="Motivation" value={motivationScore} onChange={setMotivationScore} color="var(--accent)" />
          <SliderRow icon={Target} label="Adhérence régime" value={adherenceScore} onChange={setAdherenceScore} color="var(--accent)" />
          <SliderRow icon={Dumbbell} label="Performance sport" value={workoutPerf} onChange={setWorkoutPerf} color="var(--orange)" />
        </div>
        <button onClick={handleCheckin} disabled={loading || !weight}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold grad-accent text-background disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Analyse en cours..." : "Analyser et ajuster mon programme"}
        </button>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>

      {result && (
        <div className="rounded-2xl border border-accent/30 bg-surface-1 p-4 animate-slide-up">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--accent)" }}><Sparkles className="h-4 w-4" />Ajustements</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatCard label="Nouvelles calories" value={`${result.kcal}`} unit="kcal" />
            <StatCard label="Protéines" value={`${result.protein}`} unit="g" />
            <StatCard label="Glucides" value={`${result.carbs}`} unit="g" />
            <StatCard label="Lipides" value={`${result.fat}`} unit="g" />
          </div>
          {result.cardioSessions > 0 && <div className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs">🏃 Cardio : +{result.cardioSessions} séance(s)/semaine</div>}
          {result.volumeAdjustment !== 0 && <div className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs">🏋️ Volume : {result.volumeAdjustment > 0 ? "+" : ""}{result.volumeAdjustment}%</div>}
          {result.deload && <div className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "color-mix(in oklab, var(--warning) 15%, transparent)", color: "var(--warning)" }}>🛑 Semaine de décharge recommandée</div>}
          {result.intensityModifier !== 0 && <div className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs">⚡ Intensité : {result.intensityModifier > 0 ? "+" : ""}{result.intensityModifier}%</div>}
          {result.restModifier !== 0 && <div className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs">⏱️ Repos : {result.restModifier > 0 ? "+" : ""}{result.restModifier}s entre séries</div>}
          <div className="mt-3 space-y-1">
            {result.messages.map((m, i) => (
              <div key={i} className="rounded-lg px-3 py-2 text-xs" style={{ background: "color-mix(in oklab, var(--accent) 8%, transparent)" }}>{m}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SliderRow({ icon: Icon, label, value, onChange, color, invert }: {
  icon: typeof BedDouble; label: string; value: number; onChange: (v: number) => void; color: string; invert?: boolean;
}) {
  const barColor = invert
    ? value <= 3 ? "var(--accent)" : value >= 7 ? "var(--danger)" : color
    : value >= 7 ? "var(--accent)" : value <= 3 ? "var(--danger)" : color;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
        <span className="font-mono font-semibold">{value}/10</span>
      </div>
      <input type="range" min={0} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[color:var(--accent)] h-2" style={{ accentColor: barColor }} />
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value}<span className="text-xs text-muted-foreground ml-0.5">{unit}</span></p>
    </div>
  );
}
