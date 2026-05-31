import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FoodLog, MealType, FoodSource } from "@/types/database.types";

interface LogFoodInput {
  food_name: string;
  meal_type: MealType;
  logged_date?: string;
  quantity_g?: number;
  kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  photo_url?: string;
  source?: FoodSource;
}

export interface DailyKcal {
  d: string;
  kcal: number;
  goal: number;
}

export function useFoodLogs(userId: string | undefined, date?: string) {
  const queryClient = useQueryClient();
  const today = date ?? new Date().toISOString().split("T")[0];

  const logsQuery = useQuery({
    queryKey: ["foodLogs", userId, today],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("logged_date", today)
        .order("created_at");
      return (data ?? []) as FoodLog[];
    },
    enabled: !!userId,
  });

  const logs = logsQuery.data ?? [];

  const totals = logs.reduce(
    (acc, log) => ({
      kcal: acc.kcal + (log.kcal ?? 0),
      protein: acc.protein + (log.protein_g ?? 0),
      carbs: acc.carbs + (log.carbs_g ?? 0),
      fat: acc.fat + (log.fat_g ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const groupedByMeal: Record<MealType, FoodLog[]> = {
    breakfast: logs.filter((l) => l.meal_type === "breakfast"),
    lunch: logs.filter((l) => l.meal_type === "lunch"),
    dinner: logs.filter((l) => l.meal_type === "dinner"),
    snack: logs.filter((l) => l.meal_type === "snack"),
  };

  const mealTotals = Object.fromEntries(
    Object.entries(groupedByMeal).map(([type, items]) => [
      type,
      items.reduce((s, l) => s + (l.kcal ?? 0), 0),
    ]),
  ) as Record<MealType, number>;

  const addMutation = useMutation({
    mutationFn: async (input: LogFoodInput) => {
      if (!userId) return null;
      const payload = {
        user_id: userId,
        food_name: input.food_name,
        meal_type: input.meal_type,
        logged_date: input.logged_date ?? today,
        quantity_g: input.quantity_g ?? null,
        kcal: input.kcal ?? null,
        protein_g: input.protein_g ?? null,
        carbs_g: input.carbs_g ?? null,
        fat_g: input.fat_g ?? null,
        photo_url: input.photo_url ?? null,
        source: input.source ?? "manual",
      };
      const { data, error } = await supabase
        .from("food_logs")
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error("Supabase insert food_log error:", error, "payload:", JSON.stringify(payload));
        throw error;
      }
      return data as FoodLog | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodLogs", userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("food_logs").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodLogs", userId] });
    },
  });

  return {
    logs,
    groupedByMeal,
    mealTotals,
    totals,
    isLoading: logsQuery.isLoading,
    addFood: addMutation.mutate,
    isAdding: addMutation.isPending,
    deleteFood: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function useWeeklyCalories(
  userId: string | undefined,
  targetKcal: number,
) {
  return useQuery({
    queryKey: ["weeklyCalories", userId],
    queryFn: async () => {
      if (!userId) return [];
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }

      const { data } = await supabase
        .from("food_logs")
        .select("logged_date, kcal")
        .eq("user_id", userId)
        .gte("logged_date", dates[0])
        .lte("logged_date", dates[6]);

      const dayTotals: Record<string, number> = {};
      const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

      for (const log of data ?? []) {
        dayTotals[log.logged_date] =
          (dayTotals[log.logged_date] ?? 0) + (log.kcal ?? 0);
      }

      return dates.map((d) => {
        const dt = new Date(d + "T12:00:00");
        return {
          d: dayNames[dt.getDay()],
          kcal: dayTotals[d] ?? 0,
          goal: targetKcal,
        };
      }) satisfies DailyKcal[];
    },
    enabled: !!userId,
  });
}

export function useRecentLogs(userId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ["recentFoodLogs", userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data ?? []) as FoodLog[];
    },
    enabled: !!userId,
  });
}
