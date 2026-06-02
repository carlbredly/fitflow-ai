import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFoodLogs } from "@/hooks/useFoodLog";
import { useWorkouts } from "@/hooks/useWorkout";
import { calculateAll } from "@/lib/calculations";
import type { Goal, Mode, Sex } from "@/types/database.types";

export function useDashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    profile: dbProfile,
    calculatedMacros,
    isLoading: profileLoading,
    streak,
  } = useProfile(userId);

  const {
    totals,
    isLoading: foodLoading,
  } = useFoodLogs(userId);

  const { todaySession, isLoading: workoutLoading } = useWorkouts(userId);

  const macros = useMemo(() => {
    if (calculatedMacros) return calculatedMacros;
    if (!dbProfile) return null;
    return calculateAll(
      dbProfile.weight_kg ?? 75,
      dbProfile.height_cm ?? 175,
      dbProfile.age ?? 30,
      (dbProfile.sex ?? "m") as Sex,
      (dbProfile.goal ?? "gain") as Goal,
      (dbProfile.mode ?? "normal") as Mode,
      dbProfile.activity_level,
    );
  }, [calculatedMacros, dbProfile]);

  if (!dbProfile || !macros) {
    return {
      user,
      userId,
      profile: null,
      today: totals,
      macros: null,
      modeLabel: "",
      modeEmoji: "",
      todaySession: null,
      isLoading: profileLoading || foodLoading || workoutLoading,
      streak: streak ?? 0,
    };
  }

  const modeLabel =
    dbProfile.mode === "strict"
      ? "Strict"
      : dbProfile.mode === "extreme"
        ? "Poussé"
        : "Normal";

  const modeEmoji =
    dbProfile.mode === "strict"
      ? "🟠"
      : dbProfile.mode === "extreme"
        ? "🔴"
        : "🟢";

  const programDay = dbProfile.program_start_date
    ? Math.floor(
        (Date.now() - new Date(dbProfile.program_start_date).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : 1;

  const totalDays = dbProfile.deadline_weeks
    ? dbProfile.deadline_weeks * 7
    : 0;

  return {
    user,
    userId,
    profile: {
      name: dbProfile.name,
      streak,
      mode: (dbProfile.mode ?? "normal") as "normal" | "strict" | "extreme",
      day: Math.min(programDay, totalDays || 1),
      totalDays,
      weight: dbProfile.weight_kg ?? 0,
      goalWeight: dbProfile.goal_weight_kg ?? 0,
      targetKcal: macros.kcal,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFat: macros.fat,
    },
    today: totals,
    macros,
    modeLabel,
    modeEmoji,
    todaySession,
    isLoading: profileLoading || foodLoading || workoutLoading,
  };
}
