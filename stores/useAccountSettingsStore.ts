import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  DEFAULT_ACCOUNT_SETTINGS,
  type AccountSettingsPrefs,
  type ConnectedProviderId,
  type ListVisibility,
  type NotificationPrefs,
  type PrivacyPrefs,
} from '@/components/PageComponents/Profile/AccountSettings/types';

const STORAGE_KEY = 'account_settings_prefs';

interface AccountSettingsStore extends AccountSettingsPrefs {
  hydrated: boolean;
  loadPrefs: () => Promise<void>;
  setNotification: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K],
  ) => void;
  setPrivacy: <K extends keyof PrivacyPrefs>(
    key: K,
    value: PrivacyPrefs[K],
  ) => void;
  setListVisibility: (value: ListVisibility) => void;
  toggleConnectedProvider: (id: ConnectedProviderId) => void;
}

async function persist(state: AccountSettingsPrefs) {
  const payload: AccountSettingsPrefs = {
    notifications: state.notifications,
    privacy: state.privacy,
    connectedProviders: state.connectedProviders,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export const useAccountSettingsStore = create<AccountSettingsStore>((set, get) => ({
  ...DEFAULT_ACCOUNT_SETTINGS,
  hydrated: false,

  loadPrefs: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AccountSettingsPrefs>;
      set({
        notifications: {
          ...DEFAULT_ACCOUNT_SETTINGS.notifications,
          ...parsed.notifications,
        },
        privacy: {
          ...DEFAULT_ACCOUNT_SETTINGS.privacy,
          ...parsed.privacy,
        },
        connectedProviders:
          parsed.connectedProviders ?? DEFAULT_ACCOUNT_SETTINGS.connectedProviders,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setNotification: (key, value) => {
    set((state) => ({
      notifications: { ...state.notifications, [key]: value },
    }));
    void persist(get());
  },

  setPrivacy: (key, value) => {
    set((state) => ({
      privacy: { ...state.privacy, [key]: value },
    }));
    void persist(get());
  },

  setListVisibility: (value) => {
    set((state) => ({
      privacy: { ...state.privacy, listVisibility: value },
    }));
    void persist(get());
  },

  toggleConnectedProvider: (id) => {
    set((state) => ({
      connectedProviders: state.connectedProviders.map((provider) => {
        if (provider.id !== id) return provider;
        if (provider.connected) {
          return {
            ...provider,
            connected: false,
            reviewCount: undefined,
            lastSyncedAt: undefined,
          };
        }
        return {
          ...provider,
          connected: true,
          reviewCount: 0,
          lastSyncedAt: 'just now',
        };
      }),
    }));
    void persist(get());
  },
}));
