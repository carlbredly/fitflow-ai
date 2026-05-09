export function MacroBar({ label, value, goal, color = "var(--accent)" }: { label: string; value: number; goal: number; color?: string }) {
  const pct = Math.min((value / goal) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {value}<span className="text-muted-foreground">/{goal}g</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
