import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  return process.env[name] ?? "";
}

export const supabase = createClient(
  getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("VITE_SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

export const supabaseAnon = createClient(
  getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL"),
  getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY"),
  { auth: { persistSession: false } },
);
