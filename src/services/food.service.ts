import { api } from "./api";

interface CreateFoodLogInput {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_name: string;
  quantity_g?: number;
  kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  photo_url?: string;
  source?: string;
  logged_date?: string;
}

interface FoodLogResponse {
  id: string; user_id: string; logged_date: string;
  meal_type: string; food_name: string;
  quantity_g: number | null; kcal: number | null;
  protein_g: number | null; carbs_g: number | null; fat_g: number | null;
  photo_url: string | null; source: string | null;
  created_at: string;
}

interface FoodAnalysis {
  aliments: Array<{
    nom: string; quantite_g: number; kcal: number;
    proteines_g: number; glucides_g: number; lipides_g: number;
    confiance: "haute" | "moyenne" | "basse";
  }>;
  total: { kcal: number; proteines_g: number; glucides_g: number; lipides_g: number };
  notes: string;
}

export async function getFoodLogs(token: string, date?: string) {
  const query = date ? `?date=${date}` : "";
  return api.get<FoodLogResponse[]>(`/food-logs${query}`, token);
}

export async function createFoodLog(token: string, input: CreateFoodLogInput) {
  return api.post<FoodLogResponse>("/food-logs", input, token);
}

export async function deleteFoodLog(token: string, id: string) {
  return api.delete<null>(`/food-logs/${id}`, token);
}

export async function scanFoodImage(
  token: string,
  imageBase64: string,
  mimeType: string,
) {
  return api.post<FoodAnalysis>("/ai/scan-food", {
    image_base64: imageBase64,
    mime_type: mimeType,
  }, token);
}

export async function generateAIPlan(token: string, data: {
  name: string; sex: "m" | "f"; age: number;
  weight_kg: number; height_cm: number; goal_weight_kg: number;
  goal: "gain" | "loss" | "maintain"; mode: "normal" | "strict" | "extreme";
  weeks: number; equipment: string[]; diet_constraints: string[];
}) {
  return api.post<{
    macros: { kcal: number; protein: number; carbs: number; fat: number };
    weeklyChange: number;
    sessionsPerWeek: number;
    coachSummary: string;
    sessions: Array<{
      day_index: number; session_name: string;
      exercises: Array<{ name: string; sets: number; reps: string; rest: number }>;
    }>;
    notes: string;
  }>("/ai/generate-plan", data, token);
}
