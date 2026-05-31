import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Try loading .env.local from multiple locations
const cwd = process.cwd();
config({ path: resolve(cwd, ".env.local"), override: true });
config({ path: resolve(cwd, ".env"), override: true });

export const ENV = {
  PORT: parseInt(process.env.API_PORT ?? process.env.VITE_API_PORT ?? "5000", 10),
  SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? process.env.VITE_DEEPSEEK_API_KEY ?? "",
  CLIENT_URL: process.env.CLIENT_URL ?? process.env.VITE_APP_URL ?? "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
