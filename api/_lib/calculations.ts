export type Goal = "gain" | "loss" | "maintain";
export type Mode = "normal" | "strict" | "extreme";
export type Sex = "m" | "f";

export interface MacroTargets { kcal: number; protein: number; carbs: number; fat: number; }

export function calculateAll(w: number, h: number, a: number, s: Sex, g: Goal, m: Mode): MacroTargets {
  const bmr = s === "m" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const base: Record<Goal, number> = { gain: 1.55, loss: 1.375, maintain: 1.55 };
  const adj: Record<Mode, number> = { normal: 0, strict: 0.05, extreme: 0.1 };
  const tdee = Math.round(bmr * (base[g] + adj[m]));
  const sMap: Record<string, number> = {
    gain_normal: 200, gain_strict: 300, gain_extreme: 500,
    loss_normal: -300, loss_strict: -400, loss_extreme: -500,
    maintain_normal: 0, maintain_strict: 0, maintain_extreme: 0,
  };
  const pm: Record<Mode, number> = { normal: 1.6, strict: 1.8, extreme: 2.2 };
  const tk = tdee + (sMap[`${g}_${m}`] ?? 0);
  const tp = Math.round(pm[m] * w);
  const fat = Math.round(w * 0.8);
  const carbs = Math.max(0, Math.round((tk - tp * 4 - fat * 9) / 4));
  return { kcal: tk, protein: tp, carbs, fat };
}
