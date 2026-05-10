import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env.js";

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const supabaseAnon = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export async function verifyToken(token: string): Promise<string | null> {
  const { data } = await supabaseAnon.auth.getUser(token);
  return data.user?.id ?? null;
}
