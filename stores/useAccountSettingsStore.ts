import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import accountService from '@/http/account-api/account.services';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  mapPrivacyPrefsToDAO,
  mapPrivacySettingsDAOToPrefs,
} from '@/http/account-api/types';
import {
  DEFAULT_ACCOUNT_SETTINGS,
  type AccountSettingsPrefs,
  type ConnectedProviderId,
  type NotificationPrefs,
  type PrivacyPrefs,
} from '@/components/PageComponents/Profile/AccountSettings/types';

const STORAGE_KEY = 'account_settings_prefs';

interface AccountSettingsStore extends AccountSettingsPrefs {
  hydrated: boolean;
  privacyLoadError: boolean;
  loadPrefs: () => Promise<void>;
  setNotification: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K],
  ) => void;
  setPrivacy: <K extends keyof PrivacyPrefs>(
    key: K,
    value: PrivacyPrefs[K],
  ) => void;
  toggleConnectedProvider: (id: ConnectedProviderId) => void;
}

async function persistLocalCache(state: AccountSettingsPrefs) {
  // Notifications and connected providers aren't backed by an API yet; privacy is
  // cached here too so the screen has something to show instantly while offline.
  const payload: AccountSettingsPrefs = {
    notifications: state.notifications,
    privacy: state.privacy,
    connectedProviders: state.connectedProviders,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function syncPrivacyPatch(patch: Partial<PrivacyPrefs>) {
  try {
    await accountService.updatePrivacySettings(mapPrivacyPrefsToDAO(patch));
  } catch {
    // Best-effort sync — the optimistic local update already reflects the change.
  }
}

export const useAccountSettingsStore = create<AccountSettingsStore>((set, get) => ({
  ...DEFAULT_ACCOUNT_SETTINGS,
  hydrated: false,
  privacyLoadError: false,

  loadPrefs: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
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
        });
      }
    } catch {
      // Ignore a corrupt cache — defaults already in state.
    }

    if (!useAuthStore.getState().isAuthenticated) {
      set({ hydrated: true });
      return;
    }

    try {
      const response = await accountService.getPrivacySettings();
      const dao = response.data?.data;
      if (dao) {
        set({ privacy: mapPrivacySettingsDAOToPrefs(dao), privacyLoadError: false });
        void persistLocalCache(get());
      }
    } catch {
      // Offline or request failed — keep the cached/default privacy prefs already in state.
      set({ privacyLoadError: true });
    } finally {
      set({ hydrated: true });
    }
  },

  setNotification: (key, value) => {
    set((state) => ({
      notifications: { ...state.notifications, [key]: value },
    }));
    void persistLocalCache(get());
  },

  setPrivacy: (key, value) => {
    set((state) => ({
      privacy: { ...state.privacy, [key]: value },
    }));
    void persistLocalCache(get());
    void syncPrivacyPatch({ [key]: value } as Partial<PrivacyPrefs>);
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
    void persistLocalCache(get());
  },
}));
