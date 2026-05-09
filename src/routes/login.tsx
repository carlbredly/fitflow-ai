import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Connexion — FitAI" },
    { name: "description", content: "Connecte-toi à FitAI Coach." },
  ]}),
  component: Login,
});

function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-md flex-col px-5 pt-12 pb-10">
        <div className="mb-10 text-center animate-slide-up">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl grad-accent text-background animate-pulse-glow">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">FitAI Coach</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ton coach IA, dans ta poche.</p>
        </div>

        <div className="mb-5 flex gap-1 rounded-full bg-surface-1 p-1">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 rounded-full py-2 text-sm font-medium transition"
              style={{
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "var(--accent-foreground)" : "var(--muted-foreground)",
              }}>
              {m === "login" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input type="email" placeholder="alex@fitai.app" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input type="password" placeholder="••••••••" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          {mode === "login" && (
            <button className="block w-full text-right text-xs text-muted-foreground hover:text-accent">Mot de passe oublié ?</button>
          )}
        </div>

        <Link to={mode === "signup" ? "/onboarding" : "/"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold grad-accent text-background">
          {mode === "login" ? "Se connecter" : "Créer mon compte"} <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-1 py-3.5 text-sm font-medium hover:border-accent/40 transition">
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1S8.7 5.8 12 5.8c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>
          Continuer avec Google
        </button>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          En continuant tu acceptes les <span className="text-accent">CGU</span> et la <span className="text-accent">confidentialité</span>.
        </p>
      </main>
    </div>
  );
}
