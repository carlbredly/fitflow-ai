export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  svgPath: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  unit: string;
}

export interface WeekStats {
  weekStart: string;
  weekEnd: string;
  daysWithMeals: number;
  daysOnKcalTarget: number;
  daysOnProteinTarget: number;
  workoutsCompleted: number;
  workoutsScheduled: number;
  totalKcal: number;
  avgKcal: number;
  targetKcal: number;
  weightStart: number | null;
  weightEnd: number | null;
  weightChange: number | null;
  foodStreak: number;
  scanCount: number;
  adherenceScore: number;
  hasCheckin: boolean;
}

export interface ChallengeProgress {
  challenge: WeeklyChallenge;
  current: number;
  completed: boolean;
  progressPct: number;
}

export const BADGES: BadgeDefinition[] = [
  { id: "first_meal", title: "Premier pas", description: "Enregistre ton premier repas", emoji: "🍽️", svgPath: "/badges/first_meal.svg" },
  { id: "streak_3", title: "Régulier", description: "3 jours de suite avec repas", emoji: "🔥", svgPath: "/badges/streak_3.svg" },
  { id: "streak_7", title: "Semaine parfaite", description: "7 jours de suite avec repas", emoji: "⚡", svgPath: "/badges/streak_7.svg" },
  { id: "streak_14", title: "Inarrêtable", description: "14 jours de suite", emoji: "💎", svgPath: "/badges/streak_14.svg" },
  { id: "first_workout", title: "Ça commence", description: "Complète une séance", emoji: "💪", svgPath: "/badges/first_workout.svg" },
  { id: "workout_3", title: "Athlète", description: "3 séances en une semaine", emoji: "🏋️", svgPath: "/badges/workout_3.svg" },
  { id: "protein_5", title: "Protéiné", description: "5 jours à l'objectif protéines", emoji: "🥩", svgPath: "/badges/protein_5.svg" },
  { id: "scanner", title: "Œil de lynx", description: "Scanne un repas avec l'IA", emoji: "📸", svgPath: "/badges/scanner.svg" },
  { id: "checkin", title: "Bilan", description: "Fais un check-in hebdomadaire", emoji: "📋", svgPath: "/badges/checkin.svg" },
  { id: "challenge_master", title: "Champion", description: "Complète tous les défis de la semaine", emoji: "🏆", svgPath: "/badges/challenge_master.svg" },
];

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  { id: "meals_5", title: "Journaliste", description: "Jours avec repas enregistrés", emoji: "📝", target: 5, unit: "jours" },
  { id: "workouts_3", title: "Guerrier", description: "Séances complétées", emoji: "💪", target: 3, unit: "séances" },
  { id: "protein_4", title: "Prot Master", description: "Jours objectif protéines atteint", emoji: "🥚", target: 4, unit: "jours" },
  { id: "kcal_5", title: "Précision", description: "Jours dans la cible calorique (±15%)", emoji: "🎯", target: 5, unit: "jours" },
];

export function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0]!;
}

export function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0]!;
}

export function getChallengeProgress(stats: WeekStats): ChallengeProgress[] {
  return WEEKLY_CHALLENGES.map((challenge) => {
    let current = 0;
    switch (challenge.id) {
      case "meals_5":
        current = stats.daysWithMeals;
        break;
      case "workouts_3":
        current = stats.workoutsCompleted;
        break;
      case "protein_4":
        current = stats.daysOnProteinTarget;
        break;
      case "kcal_5":
        current = stats.daysOnKcalTarget;
        break;
    }
    const progressPct = Math.min(100, Math.round((current / challenge.target) * 100));
    return {
      challenge,
      current,
      completed: current >= challenge.target,
      progressPct,
    };
  });
}

export function evaluateBadges(stats: WeekStats, unlocked: string[]): string[] {
  const newly: string[] = [];
  const has = (id: string) => unlocked.includes(id) || newly.includes(id);
  const unlock = (id: string, cond: boolean) => {
    if (cond && !has(id)) newly.push(id);
  };

  unlock("first_meal", stats.daysWithMeals >= 1);
  unlock("streak_3", stats.foodStreak >= 3);
  unlock("streak_7", stats.foodStreak >= 7);
  unlock("streak_14", stats.foodStreak >= 14);
  unlock("first_workout", stats.workoutsCompleted >= 1);
  unlock("workout_3", stats.workoutsCompleted >= 3);
  unlock("protein_5", stats.daysOnProteinTarget >= 5);
  unlock("scanner", stats.scanCount >= 1);
  unlock("checkin", stats.hasCheckin);

  const challenges = getChallengeProgress(stats);
  unlock("challenge_master", challenges.every((c) => c.completed));

  return newly;
}

export function computeAdherenceScore(stats: WeekStats): number {
  const mealScore = (stats.daysWithMeals / 7) * 35;
  const workoutScore =
    stats.workoutsScheduled > 0
      ? (stats.workoutsCompleted / stats.workoutsScheduled) * 35
      : stats.workoutsCompleted > 0
        ? 35
        : 0;
  const kcalScore = (stats.daysOnKcalTarget / 7) * 30;
  return Math.min(100, Math.round(mealScore + workoutScore + kcalScore));
}
