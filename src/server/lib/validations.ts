import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(), password: z.string().min(6),
});
export const onboardingSchema = z.object({
  name: z.string().min(1), sex: z.enum(["m", "f"]),
  age: z.number().int().min(10).max(120),
  weight_kg: z.number().positive().max(300),
  height_cm: z.number().positive().max(250),
  goal_weight_kg: z.number().positive().max(300),
  goal: z.enum(["gain", "loss", "maintain"]),
  mode: z.enum(["normal", "strict", "extreme"]),
  deadline_weeks: z.number().int().min(1).max(52),
  equipment: z.array(z.string()).min(1),
  diet_constraints: z.array(z.string()),
});
export const foodLogSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  food_name: z.string().min(1).max(200),
  quantity_g: z.number().positive().optional(),
  kcal: z.number().int().min(0).optional(),
  protein_g: z.number().min(0).optional(),
  carbs_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
  photo_url: z.string().optional(),
  source: z.enum(["manual", "ai_scan", "search"]).optional(),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export const weightLogSchema = z.object({
  weight_kg: z.number().positive().max(300),
  note: z.string().max(500).optional(),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export const workoutSessionSchema = z.object({
  session_name: z.string().min(1).max(100).optional(),
  day_index: z.number().int().positive().optional(),
  exercises: z.array(z.object({
    name: z.string(), sets: z.number().int().positive(),
    reps: z.string(), rest: z.number().int().min(0), done: z.boolean().optional(),
  })).optional(),
  completed: z.boolean().optional(),
  duration_minutes: z.number().int().positive().optional(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export const scanFoodSchema = z.object({
  image_base64: z.string().min(1), mime_type: z.string().min(1),
});
export const chatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) })),
});
export const generatePlanSchema = z.object({
  name: z.string().min(1), sex: z.enum(["m", "f"]),
  age: z.number().int().positive(), weight_kg: z.number().positive(),
  height_cm: z.number().positive(), goal_weight_kg: z.number().positive(),
  goal: z.enum(["gain", "loss", "maintain"]), mode: z.enum(["normal", "strict", "extreme"]),
  weeks: z.number().int().positive(),
  equipment: z.array(z.string()), diet_constraints: z.array(z.string()),
});
