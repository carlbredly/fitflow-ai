import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, Sparkles, Edit3, Check, X, BellOff, MessageCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profil — FitAI" }] }),
  component: Profile,
});

function Profile() {
  const { user, signOut } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const { profile: dbProfile, calculatedMacros, updateProfile, isLoading } = useProfile(userId);

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const macros = calculatedMacros ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const modeLabel = dbProfile?.mode === "strict" ? "Strict" : dbProfile?.mode === "extreme" ? "Poussé" : "Normal";

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  const startEdit = () => {
    setNewName(dbProfile?.name ?? "");
    setEditing(true);
  };

  const saveName = () => {
    if (newName.trim() && newName !== dbProfile?.name) {
      updateProfile({ name: newName.trim() });
    }
    setEditing(false);
  };

  if (isLoading || !dbProfile) {
    return (
      <AppShell header={<PageHeader title="Profil" />}>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-16 w-16 rounded-full skeleton" />
          <div className="h-4 w-32 skeleton" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader title="Profil" right={
      <button onClick={() => setShowNotif(true)} className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 hover:bg-surface-3">
        <Settings className="h-4 w-4 text-muted-foreground" />
      </button>
    } />}>
      {/* Identity */}
      <section className="rounded-3xl border border-border grad-hero p-5 text-center">
        <div className="relative mx-auto h-20 w-20">
          <div className="grid h-full w-full place-items-center rounded-full grad-accent text-3xl font-bold text-background">
            {(editing ? newName : dbProfile.name)[0]?.toUpperCase() ?? "?"}
          </div>
          <button onClick={startEdit} className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-surface-2 border border-border hover:bg-surface-3">
            <Edit3 className="h-3 w-3" />
          </button>
        </div>

        {editing ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="w-40 rounded-lg border border-accent bg-surface-2 px-3 py-1 text-center text-lg font-bold outline-none" autoFocus />
            <button onClick={saveName} className="grid h-8 w-8 place-items-center rounded-full grad-accent text-background"><Check className="h-4 w-4" /></button>
            <button onClick={() => setEditing(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : (
          <>
            <h2 className="mt-3 text-xl font-bold">{dbProfile.name}</h2>
            <p className="text-xs text-muted-foreground">Mode {modeLabel}{dbProfile.deadline_weeks ? ` · ${dbProfile.deadline_weeks} sem` : ""}</p>
          </>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface-2 p-2.5">
            <p className="font-mono text-base font-bold">{dbProfile.weight_kg ?? "?"}</p>
            <p className="text-[10px] text-muted-foreground">kg actuel</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-2.5">
            <p className="font-mono text-base font-bold" style={{ color: "var(--accent)" }}>{dbProfile.goal_weight_kg ?? "?"}</p>
            <p className="text-[10px] text-muted-foreground">kg objectif</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-2.5">
            <p className="font-mono text-base font-bold" style={{ color: "var(--orange)" }}>🔥 0</p>
            <p className="text-[10px] text-muted-foreground">streak</p>
          </div>
        </div>
      </section>

      {/* Refaire l'onboarding */}
      <Link to="/onboarding" className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-1 p-4 transition hover:border-accent/40">
        <span className="grid h-10 w-10 place-items-center rounded-xl grad-accent text-background"><Sparkles className="h-5 w-5" /></span>
        <div className="flex-1"><p className="text-sm font-semibold">Refaire l'onboarding</p><p className="text-xs text-muted-foreground">Recalcule ton plan et tes macros</p></div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Cibles */}
      <section className="mt-4 rounded-2xl border border-border bg-surface-1 p-4">
        <h3 className="text-sm font-semibold">Mes cibles quotidiennes</h3>
        <ul className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Calories</span><span className="font-mono">{macros.kcal}</span></li>
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Protéines</span><span className="font-mono">{macros.protein}g</span></li>
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Glucides</span><span className="font-mono">{macros.carbs}g</span></li>
          <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted-foreground">Lipides</span><span className="font-mono">{macros.fat}g</span></li>
        </ul>
      </section>

      {/* Settings list */}
      <ul className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-1 divide-y divide-border">
        <li>
          <button onClick={() => setShowNotif(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Notifications</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </li>
        <li>
          <button onClick={() => setShowPrivacy(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Confidentialité</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </li>
        <li>
          <button onClick={() => setShowSupport(true)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Aide & support</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </li>
      </ul>

      <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-1 py-3.5 text-sm font-medium text-destructive hover:bg-red-500/10">
        <LogOut className="h-4 w-4" /> Se déconnecter
      </button>

      {/* Modal Notifications */}
      {showNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowNotif(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface-1 p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <button onClick={() => setShowNotif(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Rappels quotidiens</p>
                <p className="text-xs text-muted-foreground">Rappel pour enregistrer tes repas</p>
              </div>
              <button onClick={() => setNotifEnabled(!notifEnabled)} className="grid h-7 w-12 place-items-center rounded-full transition"
                style={{ background: notifEnabled ? "var(--accent)" : "var(--surface-3)" }}>
                <span className="h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: notifEnabled ? "translateX(10px)" : "translateX(-10px)" }} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Rappel de séance</p>
                <p className="text-xs text-muted-foreground">Notification avant ta séance du jour</p>
              </div>
              <button onClick={() => setNotifEnabled(!notifEnabled)} className="grid h-7 w-12 place-items-center rounded-full transition"
                style={{ background: notifEnabled ? "var(--accent)" : "var(--surface-3)" }}>
                <span className="h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: notifEnabled ? "translateX(10px)" : "translateX(-10px)" }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confidentialité */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowPrivacy(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface-1 p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold"><Shield className="inline h-5 w-5 mr-1" />Confidentialité</h3>
              <button onClick={() => setShowPrivacy(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Données personnelles</strong><br />Ton poids, taille, objectifs et repas sont stockés de manière sécurisée dans Supabase. Seul toi y as accès via Row Level Security.</p>
              <p><strong className="text-foreground">Photos</strong><br />Les photos de repas ne sont jamais sauvegardées. Elles sont envoyées à DeepSeek pour analyse puis supprimées immédiatement.</p>
              <p><strong className="text-foreground">IA</strong><br />Les conversations avec Coach FitAI sont traitées par DeepSeek. Aucune donnée personnelle n'est partagée avec des tiers.</p>
              <p><strong className="text-foreground">Suppression</strong><br />Tu peux supprimer ton compte à tout moment. Toutes tes données seront effacées définitivement.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Support */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowSupport(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface-1 p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold"><HelpCircle className="inline h-5 w-5 mr-1" />Aide & support</h3>
              <button onClick={() => setShowSupport(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <Link to="/chat" onClick={() => setShowSupport(false)}
                className="flex items-center gap-3 rounded-xl bg-surface-2 p-4 transition hover:bg-surface-3">
                <span className="grid h-9 w-9 place-items-center rounded-full grad-accent text-background"><MessageCircle className="h-4 w-4" /></span>
                <div className="flex-1"><p className="font-medium text-foreground">Parler au Coach FitAI</p><p className="text-xs">Pose tes questions directement à l'IA</p></div>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="font-medium text-foreground">📧 Email</p>
                <p className="text-xs mt-1">support@fitai.coach</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="font-medium text-foreground">📱 Version</p>
                <p className="text-xs mt-1">FitAI Coach v1.0 — Mai 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
