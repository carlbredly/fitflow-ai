import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : undefined) ?? "";
const supabaseAnonKey = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined) ?? "";
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
