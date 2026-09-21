import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { create } from 'zustand';
import accountService from '@/http/account-api/account.services';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  mapNotificationPrefsToDAO,
  mapNotificationSettingsDAOToPrefs,
  mapPrivacyPrefsToDAO,
  mapPrivacySettingsDAOToPrefs,
} from '@/http/account-api/types';
import {
  DEFAULT_ACCOUNT_SETTINGS,
  DEFAULT_CONNECTED_PROVIDERS,
  type AccountSettingsPrefs,
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
}

function deviceTimezone(): string {
  return (
    Localization.getCalendars()[0]?.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    'UTC'
  );
}

async function persistLocalCache(state: AccountSettingsPrefs) {
  // Privacy + notifications only — connected providers come from the reviews API.
  const payload: AccountSettingsPrefs = {
    notifications: state.notifications,
    privacy: state.privacy,
    connectedProviders: DEFAULT_CONNECTED_PROVIDERS,
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

async function syncNotificationPatch(patch: Partial<NotificationPrefs>) {
  try {
    await accountService.updateNotificationSettings(
      mapNotificationPrefsToDAO(patch, deviceTimezone()),
    );
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
          connectedProviders: DEFAULT_CONNECTED_PROVIDERS,
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
    }

    try {
      const response = await accountService.getNotificationSettings();
      const dao = response.data?.data;
      if (dao) {
        set({ notifications: mapNotificationSettingsDAOToPrefs(dao) });
        void persistLocalCache(get());
        // Keep server timezone in sync with this device.
        void accountService.updateNotificationSettings({
          timezone: deviceTimezone(),
        });
      }
    } catch {
      // Offline or request failed — keep the cached/default notification prefs.
    } finally {
      set({ hydrated: true });
    }
  },

  setNotification: (key, value) => {
    set((state) => ({
      notifications: { ...state.notifications, [key]: value },
    }));
    void persistLocalCache(get());
    void syncNotificationPatch({ [key]: value } as Partial<NotificationPrefs>);
  },

  setPrivacy: (key, value) => {
    set((state) => ({
      privacy: { ...state.privacy, [key]: value },
    }));
    void persistLocalCache(get());
    void syncPrivacyPatch({ [key]: value } as Partial<PrivacyPrefs>);
  },
}));
