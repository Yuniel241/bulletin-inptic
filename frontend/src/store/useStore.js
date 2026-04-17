import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../utils/api';

// Auth store — persisted
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await authAPI.login(email, password);
          const { access_token, user } = res.data;
          localStorage.setItem('auth_token', access_token);
          set({ token: access_token, user, loading: false });
          return { ok: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Identifiants incorrects.';
          set({ loading: false, error: msg });
          return { ok: false, error: msg };
        }
      },

      logout: async () => {
        try { await authAPI.logout(); } catch (_) {}
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'inptic-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);

// UI store
export const useUIStore = create((set) => ({
  activePage: 'dashboard',
  setActivePage: (p) => set({ activePage: p }),
}));

// backward compat
export const useStore = useAuthStore;
