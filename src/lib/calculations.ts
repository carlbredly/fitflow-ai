export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: "m" | "f",
): number {
  if (sex === "m") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activityLevel: number): number {
  return Math.round(bmr * activityLevel);
}

export function getActivityMultiplier(goal: string, mode: string, activityLevel?: number | null): number {
  if (activityLevel && activityLevel >= 1.0 && activityLevel <= 2.5) {
    return activityLevel;
  }
  const baseMultiplier: Record<string, number> = {
    gain: 1.55,
    loss: 1.375,
    maintain: 1.55,
  };

  const modeAdjustment: Record<string, number> = {
    normal: 0,
    strict: 0.05,
    extreme: 0.1,
  };

  return (baseMultiplier[goal] ?? 1.55) + (modeAdjustment[mode] ?? 0);
}

export type Goal = "gain" | "loss" | "maintain";
export type Mode = "normal" | "strict" | "extreme";

export interface MacroTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateMacros(
  tdee: number,
  goal: Goal,
  mode: Mode,
  weightKg: number,
): MacroTargets {
  const surplusMap: Record<string, number> = {
    gain_normal: 200,
    gain_strict: 300,
    gain_extreme: 500,
    loss_normal: -300,
    loss_strict: -400,
    loss_extreme: -500,
    maintain_normal: 0,
    maintain_strict: 0,
    maintain_extreme: 0,
  };

  const proteinMap: Record<string, number> = {
    normal: 1.6,
    strict: 1.8,
    extreme: 2.2,
  };

  const key = `${goal}_${mode}`;
  const calorieAdjustment = surplusMap[key] ?? 0;

  const targetKcal = tdee + calorieAdjustment;
  const proteinPerKg = proteinMap[mode] ?? 1.6;
  const targetProtein = Math.round(proteinPerKg * weightKg);
  const proteinKcal = targetProtein * 4;

  const fatMin = Math.round(weightKg * 0.8);
  const fatKcal = fatMin * 9;

  const remainingKcal = targetKcal - proteinKcal - fatKcal;
  const targetCarbs = Math.max(0, Math.round(remainingKcal / 4));

  return {
    kcal: targetKcal,
    protein: targetProtein,
    carbs: targetCarbs,
    fat: fatMin,
  };
}

export function calculateAll(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: "m" | "f",
  goal: Goal,
  mode: Mode,
  activityLevel?: number | null,
): MacroTargets {
  const bmr = calculateBMR(weightKg, heightCm, age, sex);
  const activity = getActivityMultiplier(goal, mode, activityLevel);
  const tdee = calculateTDEE(bmr, activity);
  return calculateMacros(tdee, goal, mode, weightKg);
}

export function calculateWeeklyChange(
  goal: Goal,
  mode: Mode,
): number {
  const rates: Record<string, number> = {
    gain_normal: 0.25,
    gain_strict: 0.5,
    gain_extreme: 1.0,
    loss_normal: -0.25,
    loss_strict: -0.5,
    loss_extreme: -1.0,
    maintain_normal: 0,
    maintain_strict: 0,
    maintain_extreme: 0,
  };

  return rates[`${goal}_${mode}`] ?? 0;
}

export function calculateDeadlineEnd(
  startDate: Date,
  weeks: number,
): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + weeks * 7);
  return end;
}

export function getModeIntensity(mode: Mode): number {
  const map: Record<Mode, number> = {
    normal: 3,
    strict: 4,
    extreme: 5.5,
  };
  return map[mode] ?? 3;
}
