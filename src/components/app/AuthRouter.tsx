"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { Profile } from "@/types/database.types";

const PUBLIC_ROUTES = new Set(["/login"]);
const ONBOARDING_ROUTE = "/onboarding";

export function needsOnboarding(profile: Profile | null | undefined): boolean {
  if (!profile) return true;
  return !profile.weight_kg || !profile.height_cm || !profile.program_start_date;
}

export function AuthRouter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);

  const isPublic = PUBLIC_ROUTES.has(pathname);
  const isOnboarding = pathname === ONBOARDING_ROUTE;
  const showLoader =
    authLoading || (!!user && !isPublic && profileLoading && !isOnboarding);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (!isPublic) router.replace("/login");
      return;
    }

    if (isPublic) {
      router.replace(needsOnboarding(profile) ? ONBOARDING_ROUTE : "/");
      return;
    }

    if (profileLoading) return;

    if (!isOnboarding && needsOnboarding(profile)) {
      router.replace(ONBOARDING_ROUTE);
    }
  }, [user, authLoading, profile, profileLoading, pathname, router, isPublic, isOnboarding]);

  if (showLoader) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 animate-pulse-glow" style={{ color: "var(--accent)" }}>
          <Sparkles className="h-7 w-7" />
        </div>
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (!user && !isPublic) return null;

  return <>{children}</>;
}
