import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const isBrowser = typeof window !== "undefined";

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: true,
    detectSessionInUrl: isBrowser,
    storage: isBrowser
      ? localStorage
      : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
  },
});
