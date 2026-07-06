import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, AuthState } from '../types/auth';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

interface AuthActions {
  setAuth: (user: User, token: string, refreshToken?: string) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => Promise<void>;
  loadToken: () => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  accountType: null,

  setAuth: async (user, token, refreshToken) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
    set({
      user,
      token,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
      accountType: user.accountType,
    });
  },

  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...partial };
      return {
        user,
        accountType: partial.accountType ?? state.accountType,
      };
    });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      accountType: null,
    });
  },

  loadToken: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (token) {
      set({ token, refreshToken, isAuthenticated: true });
    }
  },

  setAccessToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token });
  },
}));
