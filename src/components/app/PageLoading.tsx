import { Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";

export function PageLoading({
  title,
  subtitle = "Chargement…",
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <AppShell header={<PageHeader title={title} subtitle={subtitle} />}>
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div
          className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 animate-pulse-glow"
          style={{ color: "var(--accent)" }}
        >
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="h-4 w-32 skeleton" />
        <div className="h-3 w-48 skeleton" />
      </div>
    </AppShell>
  );
}
