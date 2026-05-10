import { api } from "./api";

interface DashboardResponse {
  profile: {
    name: string;
    weight_kg: number | null;
    goal_weight_kg: number | null;
    goal: string | null;
    mode: string | null;
    program_start_date: string | null;
    deadline_weeks: number | null;
  } | null;
  macros: { kcal: number; protein: number; carbs: number; fat: number };
  today: { kcal: number; protein: number; carbs: number; fat: number };
  streak: number;
  sessionsThisMonth: number;
  recentMeals: Array<{
    id: string;
    food_name: string;
    logged_date: string;
    meal_type: string;
    kcal: number | null;
  }>;
  todayWorkout: {
    session_name: string | null;
    exercises: Array<{ name: string; sets: number; reps: string; rest: number; done: boolean }>;
    completed: boolean;
  } | null;
  weeklyCalories: Array<{ d: string; kcal: number; goal: number }>;
  weeklyWeight: Array<{ date: string; w: number }>;
}

export async function getDashboardStats(token: string): Promise<DashboardResponse> {
  return api.get<DashboardResponse>("/dashboard/stats", token);
}
