export type WeeklyData = {
  currentWeight: number;
  previousWeight: number;
  targetGoal: "loss" | "gain" | "maintain";
  fatigueScore: number;
  adherenceScore: number;
  workoutPerformance: number;
  currentKcal: number;
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  sleepScore: number;
  motivationScore: number;
};

export interface AdjustedPlan {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  cardioSessions: number;
  volumeAdjustment: number;
  deload: boolean;
  intensityModifier: number;
  restModifier: number;
  messages: string[];
}

export function adaptiveProgressionEngine(data: WeeklyData): AdjustedPlan {
  const weightDelta = data.currentWeight - data.previousWeight;
  const messages: string[] = [];

  let kcal = data.currentKcal;
  let cardioSessions = 0;
  let volumeAdjustment = 0;
  let deload = false;
  let intensityModifier = 0;
  let restModifier = 0;

  // === FAT LOSS ===
  if (data.targetGoal === "loss") {
    if (weightDelta >= -0.1) {
      kcal = Math.round(kcal - 150);
      cardioSessions += 1;
      messages.push("🔍 Stagnation de poids — calories réduites de 150, +1 cardio/semaine");
    }
    if (weightDelta <= -1.5) {
      kcal = Math.round(kcal + 200);
      messages.push("⚡ Perte trop rapide (>1.5kg/sem) — calories augmentées de 200");
    }
  }

  // === MUSCLE GAIN ===
  if (data.targetGoal === "gain") {
    if (weightDelta < 0.1) {
      kcal = Math.round(kcal + 200);
      messages.push("📈 Gain insuffisant — calories +200");
    }
    if (weightDelta > 1.0) {
      kcal = Math.round(kcal - 100);
      messages.push("⚠️ Prise excessive (>1kg/sem) — calories -100");
    }
  }

  // === MAINTENANCE ===
  if (data.targetGoal === "maintain") {
    if (Math.abs(weightDelta) > 0.5) {
      kcal = Math.round(kcal + (weightDelta > 0 ? -100 : 100));
      messages.push("🎯 Écart maintenance — calories ajustées");
    }
  }

  // === FATIGUE MANAGEMENT ===
  if (data.fatigueScore >= 8) {
    deload = true;
    volumeAdjustment = -40;
    intensityModifier = -20;
    restModifier = 30;
    messages.push("😴 Fatigue élevée détectée — semaine de décharge activée (volume -40%, repos +30s)");
  } else if (data.fatigueScore >= 6) {
    volumeAdjustment = -15;
    restModifier = 15;
    messages.push("🟡 Fatigue modérée — volume réduit de 15%, repos +15s");
  }

  // === PERFORMANCE CHECK ===
  if (data.workoutPerformance <= 4) {
    volumeAdjustment = Math.min(volumeAdjustment - 15, -30);
    messages.push("📉 Performance basse — volume réduit");
  } else if (data.workoutPerformance >= 8) {
    volumeAdjustment = Math.max(volumeAdjustment + 5, 10);
    intensityModifier = Math.max(intensityModifier + 5, 10);
    messages.push("🚀 Performance élevée — volume et intensité augmentés");
  }

  // === SLEEP IMPACT ===
  if (data.sleepScore <= 4) {
    restModifier = Math.max(restModifier + 15, 30);
    messages.push("💤 Sommeil insuffisant — repos allongé de 15s entre séries");
    if (data.fatigueScore < 6) volumeAdjustment -= 10;
  }

  // === ADHERENCE ===
  if (data.adherenceScore >= 9) {
    messages.push("✅ Excellente adhérence — continue comme ça !");
  } else if (data.adherenceScore <= 5) {
    messages.push("🔄 Adhérence faible — programme allégé pour maintenir la motivation");
    if (!deload) volumeAdjustment = Math.min(volumeAdjustment - 10, -15);
  }

  // === MOTIVATION ===
  if (data.motivationScore <= 4 && !deload) {
    volumeAdjustment = -10;
    messages.push("💪 Motivation basse — volume allégé, focus sur la régularité");
  }

  // === MACRO RECALCULATION ===
  const proteinPerKg = 2.0;
  const estimatedWeight = data.currentWeight;
  const protein = Math.round(proteinPerKg * estimatedWeight);
  const fat = Math.round(estimatedWeight * 0.9);
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));

  if (messages.length === 0) {
    messages.push("✅ Tout est stable — programme inchangé cette semaine");
  }

  return {
    kcal,
    protein,
    carbs,
    fat,
    cardioSessions,
    volumeAdjustment,
    deload,
    intensityModifier,
    restModifier,
    messages,
  };
}
