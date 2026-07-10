import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
  setTheme: async (theme) => {
    set({ theme });
    colorScheme.set(theme);
    await AsyncStorage.setItem('app_theme', theme);
  },
  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark') {
      set({ theme: saved });
      colorScheme.set(saved);
    }
  },
}));
