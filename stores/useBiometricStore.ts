import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  authenticateWithBiometrics,
  isBiometricHardwareAvailable,
} from '../services/biometricAuth';

const BIOMETRIC_ENABLED_KEY = 'biometric_unlock_enabled';

interface BiometricStore {
  enabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Prompt biometrics then persist opt-in. Returns false if unavailable or cancelled. */
  enableWithPrompt: (promptMessage: string) => Promise<boolean>;
}

export const useBiometricStore = create<BiometricStore>((set, get) => ({
  enabled: false,
  loaded: false,

  load: async () => {
    const saved = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    set({ enabled: saved === 'true', loaded: true });
  },

  setEnabled: async (enabled) => {
    set({ enabled });
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  },

  enableWithPrompt: async (promptMessage) => {
    const available = await isBiometricHardwareAvailable();
    if (!available) {
      return false;
    }
    const ok = await authenticateWithBiometrics(promptMessage);
    if (!ok) {
      return false;
    }
    await get().setEnabled(true);
    return true;
  },
}));
