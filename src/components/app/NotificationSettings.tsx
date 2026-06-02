"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import {
  isNotificationSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  setReminderHour,
  getReminderHour,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";

const LS_DAILY = "fitai-notif-daily";
const LS_WORKOUT = "fitai-notif-workout";

export function NotificationSettings() {
  const [supported] = useState(isNotificationSupported);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [daily, setDaily] = useState(true);
  const [workout, setWorkout] = useState(true);
  const [hour, setHour] = useState(12);
  const [loading, setLoading] = useState(false);
  const [pushReady, setPushReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPermission(Notification.permission);
    setHour(getReminderHour());
    try {
      setDaily(localStorage.getItem(LS_DAILY) !== "false");
      setWorkout(localStorage.getItem(LS_WORKOUT) !== "false");
    } catch { /* ok */ }
    setPushReady(!!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  }, []);

  const enableNotifications = async () => {
    setLoading(true);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await registerServiceWorker();
      if (reg && pushReady) {
        const sub = await subscribeToPush(reg);
        if (sub) {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (token) {
            await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ subscription: sub.toJSON() }),
            });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDaily = () => {
    const v = !daily;
    setDaily(v);
    localStorage.setItem(LS_DAILY, String(v));
  };

  const toggleWorkout = () => {
    const v = !workout;
    setWorkout(v);
    localStorage.setItem(LS_WORKOUT, String(v));
  };

  const onHourChange = (h: number) => {
    setHour(h);
    setReminderHour(h);
  };

  if (!supported) {
    return <p className="text-xs text-muted-foreground">Notifications non supportées sur ce navigateur.</p>;
  }

  return (
    <div className="space-y-4">
      {permission !== "granted" ? (
        <button
          type="button"
          onClick={enableNotifications}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold grad-accent text-background disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
          Activer les notifications
        </button>
      ) : (
        <p className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--accent)" }}>
          <Bell className="h-3.5 w-3.5" /> Notifications activées
          {pushReady ? " (push)" : " (rappels locaux)"}
        </p>
      )}

      <div>
        <label className="text-xs text-muted-foreground">Heure du rappel quotidien</label>
        <input
          type="range"
          min={7}
          max={21}
          value={hour}
          onChange={(e) => onHourChange(Number(e.target.value))}
          className="mt-1 w-full accent-[var(--accent)]"
        />
        <p className="text-center text-sm font-mono mt-1">{hour}:00</p>
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium">Rappels repas</p>
          <p className="text-xs text-muted-foreground">Journal alimentaire</p>
        </div>
        <Toggle on={daily} onToggle={toggleDaily} />
      </div>
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium">Rappel séance</p>
          <p className="text-xs text-muted-foreground">Entraînement du jour</p>
        </div>
        <Toggle on={workout} onToggle={toggleWorkout} />
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="grid h-7 w-12 place-items-center rounded-full transition"
      style={{ background: on ? "var(--accent)" : "var(--surface-3)" }}
    >
      <span
        className="h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(10px)" : "translateX(-10px)" }}
      />
    </button>
  );
}
