export function todayISO(): string { return new Date().toISOString().split("T")[0]!; }
export function dateRange(n: number): [string, string] {
  const e = new Date(); const s = new Date(); s.setDate(s.getDate() - n);
  return [s.toISOString().split("T")[0]!, e.toISOString().split("T")[0]!];
}
export function monthStart(): string { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]!; }
export function daysAgoISO(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]!; }
