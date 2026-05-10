import { create } from "zustand";
import { getDashboardStats } from "@/services/dashboard.service";
import { useAuthStore } from "./auth.store";

interface MacroTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DashboardProfile {
  name: string;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  goal: string | null;
  mode: string | null;
  program_start_date: string | null;
  deadline_weeks: number | null;
}

interface TodayStats {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DashboardState {
  profile: DashboardProfile | null;
  macros: MacroTargets;
  today: TodayStats;
  streak: number;
  sessionsThisMonth: number;
  recentMeals: Array<{
    id: string;
    food_name: string;
    logged_date: string;
    meal_type: string;
    kcal: number | null;
  }>;
  weeklyCalories: Array<{ d: string; kcal: number; goal: number }>;
  weeklyWeight: Array<{ date: string; w: number }>;
  isLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  profile: null,
  macros: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  today: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  streak: 0,
  sessionsThisMonth: 0,
  recentMeals: [],
  weeklyCalories: [],
  weeklyWeight: [],
  isLoading: false,
  error: null,
};

export const useDashboardStore = create<DashboardState>()((set) => ({
  ...initialState,

  fetchDashboard: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });
    try {
      const data = await getDashboardStats(token);
      set({
        profile: data.profile,
        macros: data.macros,
        today: data.today,
        streak: data.streak,
        sessionsThisMonth: data.sessionsThisMonth,
        recentMeals: data.recentMeals,
        weeklyCalories: data.weeklyCalories,
        weeklyWeight: data.weeklyWeight,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erreur chargement dashboard",
        isLoading: false,
      });
    }
  },

  reset: () => set(initialState),
}));
