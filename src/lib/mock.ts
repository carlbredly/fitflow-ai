export const profile = {
  name: "Alex",
  streak: 12,
  mode: "strict" as const,
  day: 35,
  totalDays: 42,
  weight: 78.4,
  goalWeight: 82,
  targetKcal: 2340,
  targetProtein: 165,
  targetCarbs: 290,
  targetFat: 72,
};

export const today = {
  kcal: 1847,
  protein: 124,
  carbs: 198,
  fat: 48,
};

export const meals = [
  { id: 1, type: "breakfast", emoji: "🌅", name: "Petit-déjeuner", kcal: 456, items: [
    { name: "Flocons d'avoine", qty: "80g", kcal: 312 },
    { name: "Banane", qty: "1 pièce", kcal: 89 },
    { name: "Café noir", qty: "200ml", kcal: 5 },
    { name: "Whey protéine", qty: "30g", kcal: 50 },
  ]},
  { id: 2, type: "lunch", emoji: "☀️", name: "Déjeuner", kcal: 720, items: [
    { name: "Poulet grillé", qty: "180g", kcal: 297 },
    { name: "Riz basmati", qty: "150g", kcal: 195 },
    { name: "Brocolis vapeur", qty: "200g", kcal: 68 },
    { name: "Huile d'olive", qty: "15ml", kcal: 160 },
  ]},
  { id: 3, type: "snack", emoji: "🥤", name: "Collation", kcal: 271, items: [
    { name: "Skyr", qty: "200g", kcal: 130 },
    { name: "Amandes", qty: "25g", kcal: 141 },
  ]},
  { id: 4, type: "dinner", emoji: "🌙", name: "Dîner", kcal: 0, items: [] },
];

export const recentMeals = [
  { emoji: "🥤", name: "Skyr + amandes", time: "16:20", kcal: 271 },
  { emoji: "☀️", name: "Poulet, riz, brocolis", time: "12:45", kcal: 720 },
  { emoji: "🌅", name: "Avoine + banane", time: "07:30", kcal: 456 },
];

export const weekDays = [
  { d: "L", date: 8, done: true, type: "Push" },
  { d: "M", date: 9, done: true, type: "Pull" },
  { d: "M", date: 10, done: false, today: true, type: "Chest & Tri" },
  { d: "J", date: 11, done: false, type: "Legs" },
  { d: "V", date: 12, done: false, type: "Back & Bi" },
  { d: "S", date: 13, done: false, type: "Cardio" },
  { d: "D", date: 14, done: false, type: "Repos" },
];

export const todayWorkout = {
  name: "Chest & Triceps",
  duration: 50,
  done: 4,
  total: 6,
  exercises: [
    { id: 1, name: "Développé couché", sets: 4, reps: "8-10", rest: 90, done: true },
    { id: 2, name: "Développé incliné haltères", sets: 4, reps: "10-12", rest: 75, done: true },
    { id: 3, name: "Écarté poulie", sets: 3, reps: "12-15", rest: 60, done: true },
    { id: 4, name: "Dips", sets: 3, reps: "10-12", rest: 75, done: true },
    { id: 5, name: "Extension triceps poulie", sets: 4, reps: "12", rest: 60, done: false },
    { id: 6, name: "Pompes diamant", sets: 3, reps: "max", rest: 60, done: false },
  ],
};

export const weightHistory = [
  { date: "S1", w: 80.2, goal: 82 },
  { date: "S2", w: 79.6, goal: 82 },
  { date: "S3", w: 79.1, goal: 82 },
  { date: "S4", w: 78.7, goal: 82 },
  { date: "S5", w: 78.5, goal: 82 },
  { date: "S6", w: 78.4, goal: 82 },
];

export const kcalWeek = [
  { d: "Lun", kcal: 2280, goal: 2340 },
  { d: "Mar", kcal: 2410, goal: 2340 },
  { d: "Mer", kcal: 2150, goal: 2340 },
  { d: "Jeu", kcal: 2360, goal: 2340 },
  { d: "Ven", kcal: 2290, goal: 2340 },
  { d: "Sam", kcal: 2520, goal: 2340 },
  { d: "Dim", kcal: 1847, goal: 2340 },
];
