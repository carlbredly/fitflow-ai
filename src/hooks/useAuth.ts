import { useEffect, useState } from "react";
import type { User, AuthError, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth.store";

const isBrowser = typeof window !== "undefined";

function getOrigin(): string {
  if (!isBrowser) return "http://localhost:5173";
  return window.location.origin;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isBrowser) { setLoading(false); return; }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) {
        useAuthStore.getState().setAuth(session.user.id, session.access_token, session.user.user_metadata?.name as string);
      } else {
        useAuthStore.getState().clearAuth();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error: error as AuthError | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error: error as AuthError | null };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getOrigin()}/`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    return { data, error: error as AuthError | null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error: error as AuthError | null };
  };

  return { user, session, loading, signedIn: !!user, signUp, signIn, signInWithGoogle, signOut };
}
