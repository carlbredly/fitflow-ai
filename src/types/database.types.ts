export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      food_logs: {
        Row: FoodLog;
        Insert: Omit<FoodLog, "id" | "created_at">;
        Update: Partial<Omit<FoodLog, "id" | "created_at">>;
        Relationships: [];
      };
      weight_logs: {
        Row: WeightLog;
        Insert: Omit<WeightLog, "id" | "created_at">;
        Update: Partial<Omit<WeightLog, "id" | "created_at">>;
        Relationships: [];
      };
      workout_sessions: {
        Row: WorkoutSession;
        Insert: Omit<WorkoutSession, "id" | "created_at">;
        Update: Partial<Omit<WorkoutSession, "id" | "created_at">>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, "id" | "created_at">;
        Update: Partial<Omit<ChatMessage, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  sex: "m" | "f" | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal_weight_kg: number | null;
  goal: "gain" | "loss" | "maintain" | null;
  activity_level: number | null;
  mode: "normal" | "strict" | "extreme" | null;
  deadline_weeks: number | null;
  equipment: string[] | null;
  diet_constraints: string[] | null;
  program_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  logged_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_name: string;
  quantity_g: number | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  photo_url: string | null;
  source: "manual" | "ai_scan" | "ai_plan" | "search" | null;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  logged_date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  session_date: string;
  session_name: string | null;
  day_index: number | null;
  exercises: Json | null;
  completed: boolean | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Goal = "gain" | "loss" | "maintain";
export type Mode = "normal" | "strict" | "extreme";
export type Sex = "m" | "f";
export type FoodSource = "manual" | "ai_scan" | "ai_plan" | "search";
