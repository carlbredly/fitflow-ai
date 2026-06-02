const LS_PUSH = "fitai-push-subscription";
const LS_NOTIF_TIME = "fitai-notif-reminder-hour";

export function getReminderHour(): number {
  try {
    const v = localStorage.getItem(LS_NOTIF_TIME);
    return v ? parseInt(v, 10) : 12;
  } catch {
    return 12;
  }
}

export function setReminderHour(hour: number): void {
  try {
    localStorage.setItem(LS_NOTIF_TIME, String(hour));
  } catch { /* ok */ }
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (e) {
    console.warn("SW registration failed", e);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return Notification.requestPermission();
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublic) return null;

  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    });
    localStorage.setItem(LS_PUSH, JSON.stringify(sub.toJSON()));
    return sub;
  } catch (e) {
    console.warn("Push subscribe failed", e);
    return null;
  }
}

export async function showLocalNotification(
  title: string,
  options?: NotificationOptions,
): Promise<void> {
  if (Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (reg) {
    await reg.showNotification(title, {
      icon: "/icon-180.png",
      badge: "/icon-180.png",
      ...options,
    });
  } else {
    new Notification(title, { icon: "/icon-180.png", ...options });
  }
}

/** Rappels locaux quand l'app est ouverte (complète le push si pas de VAPID). */
export function startLocalReminderScheduler(
  enabled: boolean,
  getMessage: () => { title: string; body: string } | null,
): () => void {
  if (!enabled || typeof window === "undefined") return () => {};

  const tick = () => {
    const hour = getReminderHour();
    const now = new Date();
    if (now.getHours() !== hour || now.getMinutes() > 5) return;
    const key = `fitai-reminded-${now.toISOString().split("T")[0]}`;
    if (sessionStorage.getItem(key)) return;
    const msg = getMessage();
    if (!msg || Notification.permission !== "granted") return;
    sessionStorage.setItem(key, "1");
    showLocalNotification(msg.title, { body: msg.body, tag: "daily-reminder" });
  };

  const id = window.setInterval(tick, 60_000);
  tick();
  return () => window.clearInterval(id);
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function getInstallPromptEvent(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt ?? null;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
