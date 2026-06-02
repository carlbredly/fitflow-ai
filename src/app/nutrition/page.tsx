"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera, Plus, Search, Sparkles, ChevronDown, Upload,
  Check, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { CalorieRing } from "@/components/app/CalorieRing";
import { useAuth } from "@/hooks/useAuth";
import { useFoodLogs } from "@/hooks/useFoodLog";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { MealType, FoodSource, Profile } from "@/types/database.types";

interface FoodItem {
  nom: string;
  quantite_g: number;
  kcal: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
  confiance: "haute" | "moyenne" | "faible";
}

interface ScanResult {
  aliments: FoodItem[];
  total: { kcal: number; proteines_g: number; glucides_g: number; lipides_g: number };
  notes: string;
}

interface MealPlanResult {
  repas: Array<{
    type: MealType;
    aliments: FoodItem[];
  }>;
  total: { kcal: number; proteines_g: number; glucides_g: number; lipides_g: number };
}

type PortionSize = "petite" | "moyenne" | "grande";
const PORTION_FACTOR: Record<PortionSize, number> = { petite: 0.6, moyenne: 1.0, grande: 1.4 };

const tabs = ["Journal", "Scanner", "Recherche"] as const;

const mealMeta: Record<MealType, { emoji: string; label: string }> = {
  breakfast: { emoji: "🌅", label: "Petit-déjeuner" },
  lunch:     { emoji: "☀️",  label: "Déjeuner" },
  dinner:    { emoji: "🌙",  label: "Dîner" },
  snack:     { emoji: "🥤",  label: "Collation" },
};

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

function sanitizeFoodItem(raw: Partial<FoodItem>): FoodItem {
  const clamp = (v: unknown, min = 0, max = 9999) =>
    Math.min(max, Math.max(min, Math.round(Number(v) * 10) / 10 || 0));
  return {
    nom:         String(raw.nom ?? "Aliment inconnu").slice(0, 80),
    quantite_g:  clamp(raw.quantite_g, 1, 2000),
    kcal:        clamp(raw.kcal, 0, 5000),
    proteines_g: clamp(raw.proteines_g, 0, 500),
    glucides_g:  clamp(raw.glucides_g, 0, 500),
    lipides_g:   clamp(raw.lipides_g, 0, 500),
    confiance:   ["haute", "moyenne", "faible"].includes(raw.confiance as string)
      ? (raw.confiance as FoodItem["confiance"])
      : "moyenne",
  };
}

async function analyzeFoodImage(base64: string, mimeType: string): Promise<ScanResult> {
  const token = await getAuthToken();
  const res = await fetch("/api/ai/scan-food", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ image_base64: base64, mime_type: mimeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? "Analyse échouée");
  }
  const json = await res.json() as { success: boolean; data: ScanResult };
  if (!json.success || !json.data) throw new Error("Analyse échouée");
  json.data.aliments = (json.data.aliments ?? []).map(sanitizeFoodItem);
  json.data.total = json.data.aliments.reduce(
    (acc, a) => ({ kcal: acc.kcal + a.kcal, proteines_g: acc.proteines_g + a.proteines_g, glucides_g: acc.glucides_g + a.glucides_g, lipides_g: acc.lipides_g + a.lipides_g }),
    { kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 },
  );
  return json.data;
}

async function generateMealPlan(params: {
  goal: string; mode: string; targetKcal: number; targetProtein: number; targetCarbs: number; targetFat: number;
}): Promise<MealPlanResult> {
  const token = await getAuthToken();
  const res = await fetch("/api/ai/meal-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Erreur génération plan repas");
  const json = await res.json() as { success: boolean; data: MealPlanResult };
  if (!json.success || !json.data) throw new Error("Erreur génération plan repas");
  json.data.repas = json.data.repas.map((r) => ({
    ...r,
    type: (["breakfast", "lunch", "dinner", "snack"].includes(r.type) ? r.type : "snack") as MealType,
    aliments: (r.aliments ?? []).map(sanitizeFoodItem),
  }));
  json.data.total = json.data.repas.flatMap((r) => r.aliments).reduce(
    (acc, a) => ({ kcal: acc.kcal + a.kcal, proteines_g: acc.proteines_g + a.proteines_g, glucides_g: acc.glucides_g + a.glucides_g, lipides_g: acc.lipides_g + a.lipides_g }),
    { kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 },
  );
  return json.data;
}

async function searchFoodAI(query: string): Promise<Array<{ name: string; per: string; kcal: number; p: number; c: number; f: number }>> {
  const token = await getAuthToken();
  try {
    const res = await fetch("/api/ai/search-food", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query }),
    });
    const json = await res.json() as { success: boolean; data: Array<{ name: string; per: string; kcal: number; p: number; c: number; f: number }> };
    return Array.isArray(json.data) ? json.data.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export default function NutritionPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Journal");
  const { user } = useAuth();
  const userId = user?.id;
  const { calculatedMacros, isLoading: profileLoading, profile: dbProfile } = useProfile(userId);
  const { totals, groupedByMeal, mealTotals, addFood, isAdding, isLoading, deleteAiMeals } = useFoodLogs(userId);
  const macros = calculatedMacros ?? { kcal: 2000, protein: 150, carbs: 200, fat: 65 };

  if (isLoading || profileLoading) {
    return (
      <AppShell header={<PageHeader title="Nutrition" subtitle="Chargement..." />}>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-4 w-48 skeleton" />
          <div className="h-3 w-32 skeleton" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader title="Nutrition" subtitle={`${totals.kcal} / ${macros.kcal} kcal aujourd'hui`} />}>
      <div className="mb-4 flex gap-1 rounded-full bg-surface-1 p-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 rounded-full px-3 py-2 text-sm font-medium transition"
            style={{ background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "var(--accent-foreground)" : "var(--muted-foreground)" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Journal" && (
        <JournalView totals={totals} macros={macros} groupedByMeal={groupedByMeal} mealTotals={mealTotals}
          addFood={addFood} isAdding={isAdding} userId={userId} dbProfile={dbProfile} deleteAiMeals={deleteAiMeals} />
      )}
      {tab === "Scanner" && <ScannerView userId={userId} addFood={addFood} isAdding={isAdding} />}
      {tab === "Recherche" && <SearchView userId={userId} addFood={addFood} isAdding={isAdding} />}
    </AppShell>
  );
}

function JournalView({
  totals, macros, groupedByMeal, mealTotals, addFood, isAdding, userId, dbProfile, deleteAiMeals,
}: {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  macros: { kcal: number; protein: number; carbs: number; fat: number };
  groupedByMeal: Record<MealType, Array<{ id: string; food_name: string; quantity_g?: number | null; kcal?: number | null }>>;
  mealTotals: Record<MealType, number>;
  addFood: (f: { food_name: string; meal_type: MealType; quantity_g?: number; kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number; source?: FoodSource }) => void;
  isAdding: boolean;
  userId: string | undefined;
  dbProfile: Profile | null | undefined;
  deleteAiMeals: () => void;
}) {
  const [open, setOpen] = useState<MealType | null>("breakfast");
  const [addingTo, setAddingTo] = useState<MealType | null>(null);
  const [foodName, setFoodName] = useState("");
  const [foodKcal, setFoodKcal] = useState("");
  const [foodQty, setFoodQty] = useState("");
  const [foodProt, setFoodProt] = useState("");
  const [foodCarb, setFoodCarb] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const openAdd = (type: MealType) => {
    setAddingTo(type);
    setFoodName(""); setFoodKcal(""); setFoodQty("");
    setFoodProt(""); setFoodCarb(""); setFoodFat("");
  };

  const submitFood = (type: MealType) => {
    if (!foodName.trim()) return;
    addFood({
      meal_type: type, food_name: foodName.trim(),
      quantity_g: foodQty ? Number(foodQty) : undefined,
      kcal: foodKcal ? Number(foodKcal) : undefined,
      protein_g: foodProt ? Number(foodProt) : undefined,
      carbs_g: foodCarb ? Number(foodCarb) : undefined,
      fat_g: foodFat ? Number(foodFat) : undefined,
      source: "manual",
    });
    setAddingTo(null);
  };

  const handleGenerateMealPlan = useCallback(async () => {
    if (!dbProfile) return;
    setAiLoading(true);
    setAiStatus(null);
    try {
      deleteAiMeals();
      const goal = dbProfile.goal ?? "maintain";
      const mode = dbProfile.mode ?? "normal";
      const plan = await generateMealPlan({ goal, mode, targetKcal: macros.kcal, targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat });
      let saved = 0;
      for (const repas of plan.repas) {
        for (const a of repas.aliments) {
          addFood({ meal_type: repas.type, food_name: a.nom, quantity_g: a.quantite_g, kcal: a.kcal, protein_g: a.proteines_g, carbs_g: a.glucides_g, fat_g: a.lipides_g, source: "ai_scan" });
          saved++;
        }
      }
      setAiStatus({ type: "success", msg: `${saved} aliments ajoutés — ${Math.round(plan.total.kcal)} kcal` });
    } catch (err) {
      setAiStatus({ type: "error", msg: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setAiLoading(false);
      setTimeout(() => setAiStatus(null), 5000);
    }
  }, [dbProfile, macros, addFood, userId]);

  return (
    <>
      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-border bg-surface-1 p-4">
        <CalorieRing value={totals.kcal} goal={macros.kcal} size={96} />
        <div className="flex-1 space-y-2 text-xs">
          {(["protein", "carbs", "fat"] as const).map((macro) => {
            const labels = { protein: "Protéines", carbs: "Glucides", fat: "Lipides" };
            return (
              <div key={macro} className="flex justify-between">
                <span className="text-muted-foreground">{labels[macro]}</span>
                <span className="font-mono">{Math.round(totals[macro])}/{macros[macro]}g</span>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={handleGenerateMealPlan} disabled={aiLoading || isAdding || !dbProfile}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/30 bg-surface-1 p-3 text-sm font-medium transition hover:border-accent disabled:opacity-50"
        style={{ color: "var(--accent)" }}>
        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {aiLoading ? "L'IA génère ton plan repas…" : "✨ L'IA me propose mes repas du jour"}
      </button>

      {aiStatus && (
        <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
          style={{ background: aiStatus.type === "success" ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "color-mix(in oklab, #ef4444 14%, transparent)", color: aiStatus.type === "success" ? "var(--accent)" : "#ef4444" }}>
          {aiStatus.type === "success" ? <Check className="h-3 w-3 shrink-0" /> : <AlertCircle className="h-3 w-3 shrink-0" />}
          {aiStatus.msg}
        </div>
      )}

      <ul className="space-y-3">
        {(Object.entries(mealMeta) as [MealType, typeof mealMeta[MealType]][]).map(([type, meta]) => {
          const items = groupedByMeal[type];
          const kcal = mealTotals[type];
          const isOpen = open === type;
          const isAddingHere = addingTo === type;
          return (
            <li key={type} className="overflow-hidden rounded-2xl border border-border bg-surface-1">
              <button onClick={() => setOpen(isOpen ? null : type)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{items.length} aliment{items.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold" style={{ color: kcal > 0 ? "var(--accent)" : "var(--muted-foreground)" }}>{kcal} kcal</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-border bg-background/40 px-4 py-2">
                  {items.length === 0 && !isAddingHere ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">Aucun aliment ajouté</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {items.map((it) => (
                        <li key={it.id} className="flex items-center justify-between py-2.5 text-sm">
                          <div>
                            <p className="font-medium">{it.food_name}</p>
                            <p className="text-xs text-muted-foreground">{it.quantity_g ? `${it.quantity_g}g` : ""}</p>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">{it.kcal ?? 0} kcal</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isAddingHere ? (
                    <div className="space-y-2 py-2">
                      <input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="Nom de l'aliment"
                        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={foodQty} onChange={(e) => setFoodQty(e.target.value)} placeholder="Quantité (g)"
                          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent" />
                        <input type="number" value={foodKcal} onChange={(e) => setFoodKcal(e.target.value)} placeholder="Kcal"
                          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" value={foodProt} onChange={(e) => setFoodProt(e.target.value)} placeholder="Prot (g)"
                          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-accent" />
                        <input type="number" value={foodCarb} onChange={(e) => setFoodCarb(e.target.value)} placeholder="Gluc (g)"
                          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-accent" />
                        <input type="number" value={foodFat} onChange={(e) => setFoodFat(e.target.value)} placeholder="Lip (g)"
                          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-accent" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => submitFood(type)} disabled={!foodName.trim() || isAdding}
                          className="flex-1 rounded-xl py-2 text-xs font-semibold grad-accent text-background disabled:opacity-50">
                          {isAdding ? "…" : "Ajouter"}
                        </button>
                        <button onClick={() => setAddingTo(null)}
                          className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => openAdd(type)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:border-accent hover:text-accent transition">
                      <Plus className="h-3.5 w-3.5" /> Ajouter un aliment
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ScannerView({ userId, addFood, isAdding }: {
  userId: string | undefined; addFood: (f: { food_name: string; meal_type: MealType; quantity_g?: number; kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number; source?: FoodSource }) => void; isAdding: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [portion, setPortion] = useState<Record<number, PortionSize>>({});
  const [targetMeal, setTargetMeal] = useState<MealType>("lunch");

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Fichier non supporté. Utilise une image (JPG, PNG, WEBP)."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image trop grande (max 10 Mo)."); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setAnalyzing(true); setResult(null); setError(null); setSaved(false);
      try {
        const base64 = dataUrl.split(",")[1];
        const analysis = await analyzeFoodImage(base64, file.type);
        setResult(analysis);
        setPortion(Object.fromEntries(analysis.aliments.map((_, i) => [i, "moyenne" as PortionSize])));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analyse échouée. Réessaie avec une meilleure photo.");
      } finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setPreview(null); setResult(null); setAnalyzing(false); setSaved(false); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const totalAdjusted = result ? result.aliments.reduce((acc, item, i) => {
    const f = PORTION_FACTOR[portion[i] ?? "moyenne"];
    return { kcal: acc.kcal + Math.round(item.kcal * f), proteines_g: acc.proteines_g + Math.round(item.proteines_g * f * 10) / 10, glucides_g: acc.glucides_g + Math.round(item.glucides_g * f * 10) / 10, lipides_g: acc.lipides_g + Math.round(item.lipides_g * f * 10) / 10 };
  }, { kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 }) : null;

  const handleSave = () => {
    if (!result || !totalAdjusted || isAdding || saved) return;
    result.aliments.forEach((item, i) => {
      const f = PORTION_FACTOR[portion[i] ?? "moyenne"];
      addFood({ meal_type: targetMeal, food_name: item.nom, quantity_g: Math.round(item.quantite_g * f), kcal: Math.round(item.kcal * f), protein_g: Math.round(item.proteines_g * f * 10) / 10, carbs_g: Math.round(item.glucides_g * f * 10) / 10, fat_g: Math.round(item.lipides_g * f * 10) / 10, source: "ai_scan" });
    });
    setSaved(true);
  };

  if (analyzing) {
    return (
      <div className="space-y-4">
        {preview && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img src={preview} alt="" className="h-full w-full object-cover blur-sm" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-background/80 animate-pulse-glow" style={{ color: "var(--accent)" }}>
                <Sparkles className="h-8 w-8" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white">Analyse en cours…</p>
              <p className="mt-1 text-xs text-white/60">Identification des aliments et calcul des macros</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error && preview) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl opacity-50">
          <img src={preview} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-surface-1 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium">
            <RefreshCw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (result && preview && totalAdjusted) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[4/1] overflow-hidden rounded-2xl">
          <img src={preview} alt="" className="h-full w-full object-cover" />
          <button onClick={reset} className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-1 text-xs">✕</button>
        </div>
        <div className="flex gap-1 rounded-xl bg-surface-1 p-1">
          {(Object.entries(mealMeta) as [MealType, typeof mealMeta[MealType]][]).map(([type, meta]) => (
            <button key={type} onClick={() => setTargetMeal(type)}
              className="flex flex-1 flex-col items-center rounded-lg py-1.5 text-[10px] font-medium transition"
              style={{ background: targetMeal === type ? "var(--surface-3)" : "transparent", color: targetMeal === type ? "var(--foreground)" : "var(--muted-foreground)" }}>
              <span>{meta.emoji}</span>
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {result.aliments.map((item, i) => {
            const f = PORTION_FACTOR[portion[i] ?? "moyenne"];
            return (
              <li key={i} className="rounded-2xl border border-border bg-surface-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.nom}</p>
                    <p className="text-xs text-muted-foreground">~{Math.round(item.quantite_g * f)}g · {Math.round(item.kcal * f)} kcal · P{Math.round(item.proteines_g * f)}g</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: item.confiance === "haute" ? "color-mix(in oklab, var(--accent) 15%, transparent)" : item.confiance === "moyenne" ? "color-mix(in oklab, #f59e0b 15%, transparent)" : "color-mix(in oklab, #ef4444 15%, transparent)", color: item.confiance === "haute" ? "var(--accent)" : item.confiance === "moyenne" ? "#f59e0b" : "#ef4444" }}>
                    {item.confiance}
                  </span>
                </div>
                <div className="mt-2 flex gap-1 rounded-xl bg-surface-2 p-0.5">
                  {(["petite", "moyenne", "grande"] as const).map((size) => (
                    <button key={size} onClick={() => setPortion((p) => ({ ...p, [i]: size }))}
                      className="flex-1 rounded-lg py-1 text-[10px] font-medium capitalize transition"
                      style={{ background: (portion[i] ?? "moyenne") === size ? "var(--surface-3)" : "transparent", color: (portion[i] ?? "moyenne") === size ? "var(--foreground)" : "var(--muted-foreground)" }}>
                      {size}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="sticky bottom-0 rounded-2xl border border-border bg-surface-1 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Total estimé</span>
            <span className="font-mono font-bold" style={{ color: "var(--accent)" }}>{totalAdjusted.kcal} kcal</span>
          </div>
          <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
            <span className="font-mono">P: {totalAdjusted.proteines_g}g</span>
            <span className="font-mono">G: {totalAdjusted.glucides_g}g</span>
            <span className="font-mono">L: {totalAdjusted.lipides_g}g</span>
          </div>
          {result.notes && <p className="mt-2 text-xs text-muted-foreground italic">{result.notes}</p>}
          <button onClick={handleSave} disabled={isAdding || saved}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold grad-accent text-background disabled:opacity-50">
            {saved ? <><Check className="h-4 w-4" /> Ajouté au journal</> : isAdding ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : <><Plus className="h-4 w-4" /> Ajouter à {mealMeta[targetMeal].label}</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed border-border bg-surface-1 p-6 text-center">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface-2 animate-pulse-glow" style={{ color: "var(--accent)" }}>
            <Camera className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Prends en photo ton assiette</h3>
          <p className="mt-1 text-xs text-muted-foreground">L'IA identifie automatiquement les aliments et leurs macros</p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">
        <Camera className="h-4 w-4" /> Ouvrir l'appareil photo
      </button>
      <button onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-1 py-3 text-sm font-medium text-muted-foreground">
        <Upload className="h-4 w-4" /> Choisir une photo
      </button>
      <div className="rounded-2xl border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--accent)" }}>
          <Sparkles className="h-3.5 w-3.5" /> Conseils pour une analyse optimale
        </div>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Prends la photo du dessus, bien éclairée</li>
          <li>• Inclus tout le contenu de l'assiette dans le cadre</li>
          <li>• Évite les ombres sur les aliments</li>
        </ul>
      </div>
    </div>
  );
}

function SearchView({ userId, addFood, isAdding }: {
  userId: string | undefined; addFood: (f: { food_name: string; meal_type: MealType; quantity_g?: number; kcal?: number }) => void; isAdding: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ name: string; per: string; kcal: number; p: number; c: number; f: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [addedIdx, setAddedIdx] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const staticFoods = [
    { name: "Poulet grillé",     per: "100g",    kcal: 165, p: 31,  c: 0,  f: 3.6 },
    { name: "Riz basmati cuit",  per: "100g",    kcal: 130, p: 2.7, c: 28, f: 0.3 },
    { name: "Avocat",            per: "100g",    kcal: 160, p: 2,   c: 9,  f: 15  },
    { name: "Œuf entier",        per: "1 (50g)", kcal: 78,  p: 6,   c: 0.6, f: 5   },
    { name: "Skyr nature",       per: "100g",    kcal: 65,  p: 11,  c: 4,  f: 0.2 },
    { name: "Saumon",            per: "100g",    kcal: 208, p: 20,  c: 0,  f: 13  },
    { name: "Patate douce",      per: "100g",    kcal: 86,  p: 1.6, c: 20, f: 0.1 },
    { name: "Brocolis",          per: "100g",    kcal: 34,  p: 2.8, c: 7,  f: 0.4 },
  ];

  const handleSearch = useCallback((value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    const local = staticFoods.filter((f) => f.name.toLowerCase().includes(value.toLowerCase()));
    setResults(local);
    debounceRef.current = setTimeout(async () => {
      if (value.trim().length < 2) return;
      setSearching(true);
      try {
        const aiResults = await searchFoodAI(value);
        if (aiResults.length > 0) setResults(aiResults);
      } catch { /* keep static results */ }
      finally { setSearching(false); }
    }, 600);
  }, []);

  const handleAdd = (food: typeof results[number], idx: number) => {
    addFood({ meal_type: "lunch", food_name: food.name, quantity_g: 100, kcal: food.kcal });
    setAddedIdx(idx);
    setTimeout(() => setAddedIdx(null), 1500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-3 py-2.5">
        {searching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
        <input value={q} onChange={(e) => handleSearch(e.target.value)} placeholder="Rechercher un aliment…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        {q && <button onClick={() => { setQ(""); setResults([]); }} className="text-muted-foreground hover:text-foreground text-xs">✕</button>}
      </div>
      {!q && <p className="text-center text-xs text-muted-foreground py-4">Tape un aliment pour rechercher — l'IA enrichit les résultats automatiquement</p>}
      {results.map((f, idx) => (
        <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-2xl border border-border bg-surface-1 p-3">
          <div>
            <p className="text-sm font-semibold">{f.name}</p>
            <p className="text-xs text-muted-foreground">{f.per} · P{f.p}g · G{f.c}g · L{f.f}g</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm" style={{ color: "var(--accent)" }}>{f.kcal} kcal</span>
            <button onClick={() => handleAdd(f, idx)} disabled={isAdding}
              className="grid h-8 w-8 place-items-center rounded-full grad-accent text-background transition">
              {addedIdx === idx ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
