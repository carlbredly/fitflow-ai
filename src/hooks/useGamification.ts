"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  BADGES,
  getWeekStart,
  getWeekEnd,
  getChallengeProgress,
  evaluateBadges,
  computeAdherenceScore,
  type WeekStats,
} from "@/lib/gamification";

async function computeFoodStreak(userId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data } = await supabase
    .from("food_logs")
    .select("logged_date")
    .eq("user_id", userId)
    .gte("logged_date", since);

  if (!data?.length) return 0;
  const days = [...new Set(data.map((d) => d.logged_date as string))].sort().reverse();
  let streak = 0;
  const check = new Date();
  check.setHours(0, 0, 0, 0);
  for (const day of days) {
    if (day === check.toISOString().split("T")[0]) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else break;
  }
  return streak;
}

async function fetchWeekStats(
  userId: string,
  targetKcal: number,
  targetProtein: number,
): Promise<WeekStats> {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("logged_date, kcal, protein_g, source")
    .eq("user_id", userId)
    .gte("logged_date", weekStart)
    .lte("logged_date", weekEnd);

  const { data: workouts } = await supabase
    .from("workout_sessions")
    .select("session_date, completed, exercises")
    .eq("user_id", userId)
    .gte("session_date", weekStart)
    .lte("session_date", weekEnd);

  const { data: weights } = await supabase
    .from("weight_logs")
    .select("logged_date, weight_kg")
    .eq("user_id", userId)
    .gte("logged_date", weekStart)
    .lte("logged_date", weekEnd)
    .order("logged_date", { ascending: true });

  const logs = foodLogs ?? [];
  const daysWithMealsSet = new Set(logs.map((l) => l.logged_date as string));
  const daysWithMeals = daysWithMealsSet.size;

  const kcalByDay: Record<string, number> = {};
  const proteinByDay: Record<string, number> = {};
  let scanCount = 0;

  for (const log of logs) {
    const d = log.logged_date as string;
    kcalByDay[d] = (kcalByDay[d] ?? 0) + (log.kcal ?? 0);
    proteinByDay[d] = (proteinByDay[d] ?? 0) + (log.protein_g ?? 0);
    if (log.source === "ai_scan") scanCount++;
  }

  let daysOnKcalTarget = 0;
  let daysOnProteinTarget = 0;
  for (const d of daysWithMealsSet) {
    const k = kcalByDay[d] ?? 0;
    if (targetKcal > 0 && k >= targetKcal * 0.85 && k <= targetKcal * 1.15) daysOnKcalTarget++;
    const p = proteinByDay[d] ?? 0;
    if (targetProtein > 0 && p >= targetProtein * 0.8) daysOnProteinTarget++;
  }

  const totalKcal = Object.values(kcalByDay).reduce((a, b) => a + b, 0);
  const avgKcal = daysWithMeals > 0 ? Math.round(totalKcal / daysWithMeals) : 0;

  const sessions = workouts ?? [];
  const workoutsScheduled = sessions.length;
  let workoutsCompleted = 0;
  for (const s of sessions) {
    if (s.completed) {
      workoutsCompleted++;
      continue;
    }
    const exs = s.exercises as Array<{ done?: boolean }> | null;
    if (Array.isArray(exs) && exs.length > 0 && exs.every((e) => e.done)) workoutsCompleted++;
  }

  const foodStreak = await computeFoodStreak(userId);

  const { count: checkinCount } = await supabase
    .from("weekly_checkins")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const weightList = weights ?? [];
  const weightStart = weightList[0]?.weight_kg ?? null;
  const weightEnd = weightList[weightList.length - 1]?.weight_kg ?? null;
  const weightChange =
    weightStart != null && weightEnd != null ? Math.round((weightEnd - weightStart) * 10) / 10 : null;

  const stats: WeekStats = {
    weekStart,
    weekEnd,
    daysWithMeals,
    daysOnKcalTarget,
    daysOnProteinTarget,
    workoutsCompleted,
    workoutsScheduled,
    totalKcal,
    avgKcal,
    targetKcal,
    weightStart,
    weightEnd,
    weightChange,
    foodStreak,
    scanCount,
    hasCheckin: (checkinCount ?? 0) > 0,
    adherenceScore: 0,
  };
  stats.adherenceScore = computeAdherenceScore(stats);
  return stats;
}

async function fetchUnlockedBadges(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  if (!error && data?.length) return data.map((r) => r.badge_id as string);

  try {
    const cached = localStorage.getItem(`fitai-badges-${userId}`);
    return cached ? (JSON.parse(cached) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveBadges(userId: string, badgeIds: string[]): Promise<void> {
  try {
    localStorage.setItem(`fitai-badges-${userId}`, JSON.stringify(badgeIds));
  } catch { /* ok */ }

  for (const badge_id of badgeIds) {
    await supabase.from("user_badges").upsert({ user_id: userId, badge_id }, { onConflict: "user_id,badge_id" });
  }
}

export function useGamification(userId: string | undefined, targetKcal = 2000, targetProtein = 150) {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["gamification", "stats", userId, targetKcal],
    queryFn: () => fetchWeekStats(userId!, targetKcal, targetProtein),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const badgesQuery = useQuery({
    queryKey: ["gamification", "badges", userId],
    queryFn: () => fetchUnlockedBadges(userId!),
    enabled: !!userId,
  });

  const unlockMutation = useMutation({
    mutationFn: async (newIds: string[]) => {
      if (!userId || newIds.length === 0) return;
      const current = badgesQuery.data ?? [];
      const merged = [...new Set([...current, ...newIds])];
      await saveBadges(userId, merged);
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamification", "badges", userId] });
    },
  });

  const stats = statsQuery.data;
  const unlocked = badgesQuery.data ?? [];
  const challenges = stats ? getChallengeProgress(stats) : [];
  const allBadges = BADGES.map((b) => ({
    ...b,
    unlocked: unlocked.includes(b.id),
  }));

  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !stats) return;
    const newIds = evaluateBadges(stats, unlocked).filter((id) => !processedRef.current.has(id));
    if (newIds.length === 0) return;
    newIds.forEach((id) => processedRef.current.add(id));
    unlockMutation.mutate(newIds);
  }, [userId, stats, unlocked]);

  const newBadgeIds = stats ? evaluateBadges(stats, unlocked).filter((id) => !unlocked.includes(id)) : [];

  return {
    stats,
    challenges,
    allBadges,
    unlocked,
    newBadgeIds,
    adherenceScore: stats?.adherenceScore ?? 0,
    foodStreak: stats?.foodStreak ?? 0,
    isLoading: statsQuery.isLoading || badgesQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      badgesQuery.refetch();
    },
  };
}
