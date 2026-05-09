import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {header}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-border">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold leading-none">{title}</h1>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
