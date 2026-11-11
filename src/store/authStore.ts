"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authDatasource } from "@/data/datasources";
import { TOKEN_KEY, onSessionExpired } from "@/core/api/apiClient";
import type { User } from "@/domain/entities";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      // Only admin accounts may sign in to the web panel. Regular users
      // (from the mobile app) are turned away here and by the API.
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await authDatasource.login(email, password);
          if (res.role !== "admin") {
            set({ loading: false, error: "Akun ini bukan admin. Panel ini hanya untuk admin." });
            return false;
          }
          localStorage.setItem(TOKEN_KEY, res.token);
          set({
            user: { id: res.id, name: res.name, email: res.email, role: res.role },
            token: res.token,
            loading: false,
          });
          return true;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Login gagal";
          set({ error: message, loading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "bali-guide-admin-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

if (typeof window !== "undefined") {
  onSessionExpired(() => useAuthStore.getState().logout());
}
