import { create } from 'zustand';
import { authApi } from '../api/auth';
import type { User } from 'shared';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  checkSession: async () => {
    try {
      const { user } = await authApi.me();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { user } = await authApi.login(email, password);
    set({ user });
  },

  register: async (email, password) => {
    const { user } = await authApi.register(email, password);
    set({ user });
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
}));
