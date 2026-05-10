import { api } from "./api";
import { supabase } from "@/lib/supabase";

interface AuthResult {
  userId: string;
  access_token: string;
  refresh_token?: string;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data: supabaseData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const result = await api.post<AuthResult>("/auth/login", { email, password });
  return result;
}

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data: supabaseData, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const result = await api.post<AuthResult>("/auth/register", { email, password });
  return result;
}

export async function loginWithGoogle(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${import.meta.env.VITE_APP_URL ?? "http://localhost:3000"}/onboarding`,
    },
  });
}

export async function getCurrentUser(token: string) {
  return api.get<{
    id: string; name: string; email?: string;
  }>("/auth/me", token);
}
