import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Plus, Search, Sparkles, ChevronDown } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { CalorieRing } from "@/components/app/CalorieRing";
import { meals, profile, today } from "@/lib/mock";

export const Route = createFileRoute("/nutrition")({
  head: () => ({ meta: [
    { title: "Nutrition — FitAI" },
    { name: "description", content: "Journal alimentaire et scanner IA." },
  ]}),
  component: Nutrition,
});

const tabs = ["Journal", "Scanner", "Recherche"] as const;

function Nutrition() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Journal");
  const [open, setOpen] = useState<number | null>(1);

  return (
    <AppShell header={<PageHeader title="Nutrition" subtitle={`${today.kcal} / ${profile.targetKcal} kcal aujourd'hui`} />}>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-full bg-surface-1 p-1">
        {tabs.map((t) => (
          <button key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-full px-3 py-2 text-sm font-medium transition"
            style={{
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "var(--accent-foreground)" : "var(--muted-foreground)",
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Journal" && (
        <>
          <div className="mb-4 flex items-center gap-4 rounded-2xl border border-border bg-surface-1 p-4">
            <CalorieRing value={today.kcal} goal={profile.targetKcal} size={96} />
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Protéines</span><span className="font-mono">{today.protein}/{profile.targetProtein}g</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Glucides</span><span className="font-mono">{today.carbs}/{profile.targetCarbs}g</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lipides</span><span className="font-mono">{today.fat}/{profile.targetFat}g</span></div>
            </div>
          </div>

          <ul className="space-y-3">
            {meals.map((m) => {
              const isOpen = open === m.id;
              return (
                <li key={m.id} className="overflow-hidden rounded-2xl border border-border bg-surface-1">
                  <button onClick={() => setOpen(isOpen ? null : m.id)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.items.length} aliment(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold" style={{ color: m.kcal ? "var(--accent)" : "var(--muted-foreground)" }}>
                        {m.kcal} kcal
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border bg-background/40 px-4 py-2">
                      {m.items.length === 0 ? (
                        <p className="py-3 text-center text-xs text-muted-foreground">Aucun aliment ajouté</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {m.items.map((it) => (
                            <li key={it.name} className="flex items-center justify-between py-2.5 text-sm">
                              <div>
                                <p className="font-medium">{it.name}</p>
                                <p className="text-xs text-muted-foreground">{it.qty}</p>
                              </div>
                              <span className="font-mono text-xs text-muted-foreground">{it.kcal} kcal</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:border-accent hover:text-accent transition">
                        <Plus className="h-3.5 w-3.5" /> Ajouter un aliment
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === "Scanner" && (
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
          <button className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">
            <Camera className="h-4 w-4" /> Ouvrir l'appareil photo
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-1 py-3 text-sm font-medium text-muted-foreground">
            🖼️ Choisir une photo
          </button>
          <div className="rounded-2xl border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--accent)" }}>
              <Sparkles className="h-3.5 w-3.5" /> Coach FitAI
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Astuce : prends la photo du dessus, bien éclairée, avec une référence d'échelle (couvert, main) pour améliorer la précision des portions estimées.
            </p>
          </div>
        </div>
      )}

      {tab === "Recherche" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Rechercher un aliment…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          {[
            { name: "Poulet grillé", per: "100g", kcal: 165, p: 31, c: 0, f: 4 },
            { name: "Riz basmati cuit", per: "100g", kcal: 130, p: 2.7, c: 28, f: 0.3 },
            { name: "Avocat", per: "100g", kcal: 160, p: 2, c: 9, f: 15 },
            { name: "Œuf entier", per: "1 (50g)", kcal: 78, p: 6, c: 0.6, f: 5 },
            { name: "Skyr nature", per: "100g", kcal: 65, p: 11, c: 4, f: 0.2 },
          ].map((f) => (
            <div key={f.name} className="flex items-center justify-between rounded-2xl border border-border bg-surface-1 p-3">
              <div>
                <p className="text-sm font-semibold">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.per} · P{f.p} · G{f.c} · L{f.f}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm" style={{ color: "var(--accent)" }}>{f.kcal} kcal</span>
                <button className="grid h-8 w-8 place-items-center rounded-full grad-accent text-background"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Journal" && (
        <button className="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-full grad-accent text-background shadow-lg shadow-black/40 animate-pulse-glow">
          <Plus className="h-6 w-6" />
        </button>
      )}
    </AppShell>
  );
}
