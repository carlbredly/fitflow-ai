import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });           // load .env first
config({ path: resolve(process.cwd(), ".env.local"), override: true }); // .env.local overrides

export const ENV = {
  PORT: parseInt(process.env.API_PORT ?? process.env.VITE_API_PORT ?? "5000", 10),
  SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  DEEPSEEK_API_KEY: process.env.VITE_DEEPSEEK_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "",
  CLIENT_URL: process.env.VITE_APP_URL ?? process.env.CLIENT_URL ?? "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
