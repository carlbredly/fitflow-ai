import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WorkoutSession, WeightLog } from "@/types/database.types";

export function useWorkouts(userId: string | undefined) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const todayQuery = useQuery({
    queryKey: ["workout", userId, today],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("session_date", today)
        .single();
      return data as WorkoutSession | null;
    },
    enabled: !!userId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (session: {
      session_date?: string;
      session_name?: string;
      day_index?: number;
      exercises?: unknown;
      completed?: boolean;
      duration_minutes?: number;
    }) => {
      if (!userId) return null;
      const { data } = await supabase
        .from("workout_sessions")
        .upsert({
          user_id: userId,
          session_date: session.session_date ?? today,
          ...session,
        })
        .select()
        .single();
      return data as WorkoutSession | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", userId] });
    },
  });

  const updateExercisesMutation = useMutation({
    mutationFn: async ({
      id,
      exercises,
      completed,
    }: {
      id: string;
      exercises: unknown;
      completed?: boolean;
    }) => {
      await supabase
        .from("workout_sessions")
        .update({ exercises, completed: completed ?? false })
        .eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", userId] });
    },
  });

  return {
    todaySession: todayQuery.data,
    isLoading: todayQuery.isLoading,
    upsertSession: upsertMutation.mutate,
    updateExercises: updateExercisesMutation.mutate,
    isSaving: upsertMutation.isPending || updateExercisesMutation.isPending,
  };
}

export function useWeightLogs(userId: string | undefined) {
  const queryClient = useQueryClient();

  const weightHistory = useQuery({
    queryKey: ["weightLogs", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", userId!)
        .order("logged_date", { ascending: true });
      return (data ?? []) as WeightLog[];
    },
    enabled: !!userId,
  });

  const logWeight = useMutation({
    mutationFn: async ({
      weight_kg,
      date,
      note,
    }: {
      weight_kg: number;
      date?: string;
      note?: string;
    }) => {
      if (!userId) return null;
      const { data } = await supabase
        .from("weight_logs")
        .upsert({
          user_id: userId,
          logged_date: date ?? new Date().toISOString().split("T")[0],
          weight_kg,
          note: note ?? null,
        })
        .select()
        .single();
      return data as WeightLog | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightLogs", userId] });
    },
  });

  return {
    weightHistory: weightHistory.data ?? [],
    isLoading: weightHistory.isLoading,
    logWeight: logWeight.mutate,
    isLogging: logWeight.isPending,
  };
}
