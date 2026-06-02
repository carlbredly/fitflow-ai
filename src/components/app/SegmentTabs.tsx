"use client";

import type { ReactNode } from "react";

type SegmentTabsProps<T extends string> = {
  tabs: readonly T[];
  value: T;
  onChange: (tab: T) => void;
  className?: string;
  renderLabel?: (tab: T) => ReactNode;
};

export function SegmentTabs<T extends string>({
  tabs,
  value,
  onChange,
  className = "",
  renderLabel,
}: SegmentTabsProps<T>) {
  return (
    <div className={`flex gap-1 rounded-full bg-surface-1 p-1 ${className}`}>
      {tabs.map((tab) => {
        const active = tab === value;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className="flex-1 rounded-full px-3 py-2 text-sm font-medium transition"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--accent-foreground)" : "var(--muted-foreground)",
            }}
          >
            {renderLabel ? renderLabel(tab) : tab}
          </button>
        );
      })}
    </div>
  );
}
