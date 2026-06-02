"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  registerServiceWorker,
  getInstallPromptEvent,
  type BeforeInstallPromptEvent,
  startLocalReminderScheduler,
  getReminderHour,
} from "@/lib/notifications";

declare global {
  interface Window {
    deferredInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export function PwaProvider({
  children,
  remindersEnabled = true,
}: {
  children: React.ReactNode;
  remindersEnabled?: boolean;
}) {
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    registerServiceWorker();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.deferredInstallPrompt = e as BeforeInstallPromptEvent;
      const dismissed = sessionStorage.getItem("fitai-pwa-dismissed");
      if (!dismissed) setShowInstall(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setShowInstall(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!remindersEnabled) return;
    return startLocalReminderScheduler(true, () => {
      const h = getReminderHour();
      return {
        title: "FitAI Coach",
        body: `Il est ${h}h — pense à enregistrer tes repas ou ta séance !`,
      };
    });
  }, [remindersEnabled]);

  const handleInstall = async () => {
    const prompt = getInstallPromptEvent();
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
    window.deferredInstallPrompt = undefined;
  };

  return (
    <>
      {children}
      {showInstall && !installed && (
        <div className="fixed inset-x-0 bottom-20 z-50 px-4 safe-bottom pointer-events-none">
          <div className="mx-auto max-w-2xl pointer-events-auto flex items-center gap-3 rounded-2xl border border-accent/30 bg-surface-1 p-3 shadow-lg animate-slide-up">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl grad-accent text-background">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Installer FitAI Coach</p>
              <p className="text-xs text-muted-foreground">Accès rapide depuis ton écran d&apos;accueil</p>
            </div>
            <button type="button" onClick={handleInstall} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold grad-accent text-background">
              Installer
            </button>
            <button
              type="button"
              onClick={() => { sessionStorage.setItem("fitai-pwa-dismissed", "1"); setShowInstall(false); }}
              className="shrink-0 grid h-8 w-8 place-items-center rounded-full bg-surface-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
