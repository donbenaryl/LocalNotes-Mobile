import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import i18n from '../services/i18n';

interface LocaleStore {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  loadLocale: () => Promise<void>;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'en',
  setLocale: async (locale) => {
    set({ locale });
    await i18n.changeLanguage(locale);
    await AsyncStorage.setItem('app_locale', locale);
  },
  loadLocale: async () => {
    const saved = await AsyncStorage.getItem('app_locale');
    if (saved) {
      set({ locale: saved });
      await i18n.changeLanguage(saved);
    }
  },
}));
