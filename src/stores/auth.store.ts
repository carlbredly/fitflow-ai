import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  token: string | null;
  name: string | null;
  setAuth: (userId: string, token: string, name?: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      token: null,
      name: null,
      setAuth: (userId, token, name) => set({ userId, token, name: name ?? null }),
      clearAuth: () => set({ userId: null, token: null, name: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: "fitai-auth" },
  ),
);
