"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Utensils, Dumbbell, LineChart, User } from "lucide-react";

const items = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/nutrition", label: "Nutrition", Icon: Utensils },
  { href: "/workout", label: "Sport", Icon: Dumbbell },
  { href: "/progress", label: "Progrès", Icon: LineChart },
  { href: "/profile", label: "Profil", Icon: User },
] as const;

const HIDE_NAV_PREFIXES = ["/login", "/onboarding"] as const;

export function BottomNav() {
  const pathname = usePathname();
  if (HIDE_NAV_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 glass border-t border-border safe-bottom">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pt-2">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href}
                className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition"
                style={{ color: active ? "var(--accent)" : "var(--muted-foreground)" }}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
                <span className="h-1 w-1 rounded-full transition"
                  style={{ background: active ? "var(--accent)" : "transparent" }} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
