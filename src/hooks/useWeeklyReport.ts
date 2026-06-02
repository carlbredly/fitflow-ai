"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getWeekStart, type WeekStats } from "@/lib/gamification";

export interface WeeklyReportData {
  weekStart: string;
  stats: WeekStats;
  aiSummary: string;
  highlights: string[];
}

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

async function fetchCachedReport(userId: string, weekStart: string): Promise<WeeklyReportData | null> {
  const { data, error } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!error && data) {
    const stats = data.stats as WeekStats;
    return {
      weekStart,
      stats,
      aiSummary: (data.ai_summary as string) ?? "",
      highlights: (stats as WeekStats & { highlights?: string[] }).highlights ?? [],
    };
  }

  try {
    const cached = localStorage.getItem(`fitai-report-${userId}-${weekStart}`);
    return cached ? (JSON.parse(cached) as WeeklyReportData) : null;
  } catch {
    return null;
  }
}

export function useWeeklyReport(userId: string | undefined, stats: WeekStats | undefined) {
  const queryClient = useQueryClient();
  const weekStart = getWeekStart();

  const cachedQuery = useQuery({
    queryKey: ["weeklyReport", userId, weekStart],
    queryFn: () => fetchCachedReport(userId!, weekStart),
    enabled: !!userId,
  });

  const generateMutation = useMutation({
    mutationFn: async (): Promise<WeeklyReportData> => {
      if (!userId || !stats) throw new Error("Données insuffisantes");
      const token = await getAuthToken();
      const res = await fetch("/api/ai/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stats }),
      });
      if (!res.ok) throw new Error("Génération du rapport échouée");
      const json = await res.json() as { success: boolean; data: WeeklyReportData };
      if (!json.success || !json.data) throw new Error("Rapport invalide");

      try {
        localStorage.setItem(`fitai-report-${userId}-${weekStart}`, JSON.stringify(json.data));
      } catch { /* ok */ }

      await supabase.from("weekly_reports").upsert({
        user_id: userId,
        week_start: weekStart,
        stats: json.data.stats,
        ai_summary: json.data.aiSummary,
      } as Record<string, unknown>);

      return json.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["weeklyReport", userId, weekStart], data);
    },
  });

  return {
    report: generateMutation.data ?? cachedQuery.data ?? null,
    isLoading: cachedQuery.isLoading,
    isGenerating: generateMutation.isPending,
    generate: generateMutation.mutate,
    error: generateMutation.error,
  };
}
