import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import appCss from "../styles.css?url";

const FAVICON = "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#00E5A0"/><stop offset="100%" stop-color="#FF6B35"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="44" text-anchor="middle" font-size="36" fill="#0D0D0D">⚡</text></svg>`,
);

const PUBLIC_PATHS = ["/login", "/onboarding"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <Link to="/" className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0D0D0D" },
      { title: "FitAI Coach" },
    ],
    links: [
      { rel: "icon", href: FAVICON },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const pathRef = useRef(location.pathname);

  useEffect(() => { pathRef.current = location.pathname; }, [location.pathname]);

  const handleRedirect = useCallback(async (session: Session | null) => {
    const path = pathRef.current;
    const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

    if (!session && !isPublic) {
      navigate({ to: "/login", replace: true });
      setChecking(false);
      return;
    }
    if (session) {
      if (path === "/login") {
        navigate({ to: "/", replace: true });
        setChecking(false);
        return;
      }
      if (path === "/" || path === "/onboarding") {
        try {
          const { data: profile } = await supabase.from("profiles").select("goal").eq("id", session.user.id).single();
          const hasGoal = !!profile?.goal;
          if (path === "/" && !hasGoal) navigate({ to: "/onboarding", replace: true });
          if (path === "/onboarding" && hasGoal) navigate({ to: "/", replace: true });
        } catch { /* profile pas encore créé */ }
      }
    }
    setChecking(false);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    async function handle(s: Session | null) {
      if (cancelled) return;
      cancelled = true;
      const path = pathRef.current;
      const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));

      if (!s && !isPublic) { navigate({ to: "/login", replace: true }); setChecking(false); return; }
      if (s) {
        if (path === "/login") { navigate({ to: "/", replace: true }); setChecking(false); return; }
        if (path === "/" || path === "/onboarding") {
          try {
            const { data: p } = await supabase.from("profiles").select("goal").eq("id", s.user.id).single();
            if (p?.goal) {
              if (path === "/onboarding") navigate({ to: "/", replace: true });
            } else {
              if (path === "/") navigate({ to: "/onboarding", replace: true });
            }
          } catch { /* ok */ }
        }
      }
      setChecking(false);
    }

    // onAuthStateChange détecte le SIGNED_IN dès que le hash est traité
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && ["SIGNED_IN", "INITIAL_SESSION"].includes(event)) handle(session);
    });

    // fallback polling (cas où onAuthStateChange part pas)
    let attempts = 0;
    const poll = async () => {
      if (cancelled) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { handle(session); return; }
      } catch { /* SDK pas encore prêt */ }
      if (++attempts >= 20) { handle(null); return; }
      setTimeout(poll, 400);
    };
    poll();

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [handleRedirect]);

  if (checking) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 animate-pulse-glow" style={{ color: "var(--accent)" }}>
            <span className="text-xl">⚡</span>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
