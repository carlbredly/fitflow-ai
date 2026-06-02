import type { Goal, Mode } from "@/lib/calculations";

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
}

export interface WorkoutSessionTemplate {
  day_index: number;
  session_name: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlanInput {
  goal: Goal;
  mode: Mode;
  weeks: number;
  equipment: string[];
}

/** Normalise day_index (ISO 1=lun…7=dim ou JS 0=dim…6=sam) vers JS getDay(). */
export function normalizeDayIndex(dayIndex: number): number {
  if (!Number.isFinite(dayIndex)) return 1;
  const n = Math.round(dayIndex);
  if (n >= 1 && n <= 7) return n % 7;
  return ((n % 7) + 7) % 7;
}

function pickExercises(equipment: string[], goal: Goal): WorkoutExercise[][] {
  const hasGym = equipment.includes("gym");
  const hasWeights = equipment.includes("weights");
  const hasBands = equipment.includes("bands");
  const isLoss = goal === "loss";

  const push: WorkoutExercise[] = hasGym
    ? [
        { name: "Développé couché", sets: 4, reps: "8-10", rest: 90 },
        { name: "Développé incliné haltères", sets: 3, reps: "10-12", rest: 75 },
      ]
    : hasWeights
      ? [
          { name: "Développé haltères", sets: 4, reps: "8-12", rest: 90 },
          { name: "Pompes inclinées", sets: 3, reps: "12-15", rest: 60 },
        ]
      : [
          { name: "Pompes", sets: 4, reps: "10-15", rest: 60 },
          { name: "Dips sur chaise", sets: 3, reps: "8-12", rest: 60 },
        ];

  const pull: WorkoutExercise[] = hasGym
    ? [
        { name: "Tractions ou tirage vertical", sets: 4, reps: "8-10", rest: 90 },
        { name: "Rowing barre", sets: 3, reps: "10-12", rest: 75 },
      ]
    : hasBands
      ? [
          { name: "Rowing élastique", sets: 4, reps: "12-15", rest: 60 },
          { name: "Tirage face élastique", sets: 3, reps: "15-20", rest: 45 },
        ]
      : [
          { name: "Tractions assistées", sets: 4, reps: "6-10", rest: 90 },
          { name: "Rowing haltères", sets: 3, reps: "10-12", rest: 75 },
        ];

  const legs: WorkoutExercise[] = hasGym
    ? [
        { name: "Squat barre", sets: 4, reps: "8-10", rest: 120 },
        { name: "Soulevé de terre roumain", sets: 3, reps: "10-12", rest: 90 },
        { name: "Fentes marchées", sets: 3, reps: "10/jambe", rest: 75 },
      ]
    : hasWeights
      ? [
          { name: "Goblet squat", sets: 4, reps: "10-12", rest: 90 },
          { name: "Fentes haltères", sets: 3, reps: "10/jambe", rest: 75 },
          { name: "Soulevé de terre haltères", sets: 3, reps: "10-12", rest: 90 },
        ]
      : [
          { name: "Squat au poids du corps", sets: 4, reps: "15-20", rest: 60 },
          { name: "Fentes", sets: 3, reps: "12/jambe", rest: 60 },
          { name: "Pont fessier", sets: 3, reps: "15", rest: 45 },
        ];

  const fullBody: WorkoutExercise[] = [
    ...push.slice(0, 1),
    ...pull.slice(0, 1),
    ...legs.slice(0, 2),
    { name: "Planche", sets: 3, reps: "45s", rest: 45 },
  ];

  const upper: WorkoutExercise[] = [...push, ...pull.slice(0, 1), { name: "Élévations latérales", sets: 3, reps: "12-15", rest: 60 }];
  const lower: WorkoutExercise[] = [...legs, { name: "Mollets debout", sets: 4, reps: "15-20", rest: 45 }];
  const cardioFinisher: WorkoutExercise = isLoss
    ? { name: "Vélo ou marche inclinée", sets: 1, reps: "15 min", rest: 0 }
    : { name: "Étirements dynamiques", sets: 1, reps: "5 min", rest: 0 };

  return [
    [...upper, cardioFinisher],
    [...lower],
    [...fullBody],
    [...push, ...pull.slice(0, 1)],
    [...legs.slice(0, 2), { name: "Crunch", sets: 3, reps: "15", rest: 45 }],
    [...fullBody],
  ];
}

const WEEK_LAYOUT: Record<Mode, { days: number[]; names: string[] }> = {
  normal: {
    days: [1, 3, 5],
    names: ["Haut du corps", "Bas du corps", "Full body"],
  },
  strict: {
    days: [1, 2, 4, 5],
    names: ["Push", "Pull", "Jambes", "Full body"],
  },
  extreme: {
    days: [1, 2, 3, 4, 5],
    names: ["Push", "Pull", "Jambes", "Upper", "Full body + cardio"],
  },
};

export function generateLocalWorkoutPlan(input: WorkoutPlanInput): WorkoutSessionTemplate[] {
  const layout = WEEK_LAYOUT[input.mode] ?? WEEK_LAYOUT.normal;
  const exerciseSets = pickExercises(input.equipment.length ? input.equipment : ["home"], input.goal);

  return layout.days.map((day, i) => ({
    day_index: day,
    session_name: layout.names[i] ?? `Séance ${i + 1}`,
    exercises: exerciseSets[i] ?? exerciseSets[0]!,
  }));
}

export function sanitizeAiSessions(
  raw: unknown,
  fallbackInput: WorkoutPlanInput,
): WorkoutSessionTemplate[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return generateLocalWorkoutPlan(fallbackInput);
  }

  const sessions: WorkoutSessionTemplate[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const exercisesRaw = Array.isArray(row.exercises) ? row.exercises : [];
    const exercises: WorkoutExercise[] = exercisesRaw
      .map((ex) => {
        if (!ex || typeof ex !== "object") return null;
        const e = ex as Record<string, unknown>;
        const name = String(e.name ?? "").trim();
        if (!name) return null;
        return {
          name: name.slice(0, 80),
          sets: Math.min(8, Math.max(1, Math.round(Number(e.sets) || 3))),
          reps: String(e.reps ?? "10").slice(0, 20),
          rest: Math.min(300, Math.max(30, Math.round(Number(e.rest) || 90))),
        };
      })
      .filter((e): e is WorkoutExercise => e !== null);

    if (exercises.length === 0) continue;

    sessions.push({
      day_index: normalizeDayIndex(Number(row.day_index)),
      session_name: String(row.session_name ?? "Séance").slice(0, 60),
      exercises,
    });
  }

  return sessions.length > 0 ? sessions : generateLocalWorkoutPlan(fallbackInput);
}

export function estimateSessionMinutes(exercises: WorkoutExercise[]): number {
  const total = exercises.reduce(
    (sum, e) => sum + (e.rest / 60) * e.sets + 0.75 * e.sets,
    0,
  );
  return Math.round(total) + 5;
}

export interface ScheduledWorkoutRow {
  user_id: string;
  session_date: string;
  session_name: string;
  day_index: number;
  exercises: WorkoutExercise[];
  duration_minutes: number;
}

/** Planifie toutes les séances sur `weeks` semaines à partir de `startDate`. */
export function scheduleWorkoutSessions(
  userId: string,
  templates: WorkoutSessionTemplate[],
  weeks: number,
  startDate = new Date(),
): ScheduledWorkoutRow[] {
  const ref = new Date(startDate);
  ref.setHours(0, 0, 0, 0);
  const safeWeeks = Math.min(16, Math.max(1, weeks || 4));
  const rows: ScheduledWorkoutRow[] = [];

  for (let week = 0; week < safeWeeks; week++) {
    for (const template of templates) {
      const jsDay = normalizeDayIndex(template.day_index);
      const d = new Date(ref);
      const firstOffset = (jsDay - ref.getDay() + 7) % 7;
      d.setDate(ref.getDate() + firstOffset + week * 7);

      rows.push({
        user_id: userId,
        session_date: d.toISOString().split("T")[0]!,
        session_name: template.session_name,
        day_index: jsDay,
        exercises: template.exercises,
        duration_minutes: estimateSessionMinutes(template.exercises),
      });
    }
  }

  return rows;
}
