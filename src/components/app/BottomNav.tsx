import { Link, useLocation } from "@tanstack/react-router";
import { Home, Utensils, Dumbbell, LineChart, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/nutrition", label: "Nutrition", Icon: Utensils },
  { to: "/workout", label: "Workout", Icon: Dumbbell },
  { to: "/progress", label: "Progress", Icon: LineChart },
  { to: "/profile", label: "Profil", Icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 glass border-t border-border safe-bottom">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pt-2">
        {items.map(({ to, label, Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition"
                style={{ color: active ? "var(--accent)" : "var(--muted-foreground)" }}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
                <span
                  className="h-1 w-1 rounded-full transition"
                  style={{ background: active ? "var(--accent)" : "transparent" }}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
