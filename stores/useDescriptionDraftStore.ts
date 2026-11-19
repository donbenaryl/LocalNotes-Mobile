import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'business_description_drafts';

type Drafts = Record<string, string>;

interface DescriptionDraftStore {
  /** Latest unused AI description draft per business id. */
  drafts: Drafts;
  loaded: boolean;
  load: () => Promise<void>;
  setDraft: (businessId: string, text: string) => void;
  clearDraft: (businessId: string) => void;
}

async function persist(drafts: Drafts) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Best effort: the in-memory draft still works for this session.
  }
}

/**
 * Keeps an unused draft until the owner regenerates, uses it, or switches business.
 * Deliberately not cleared on sign-out: the key is the business, not the session.
 */
export const useDescriptionDraftStore = create<DescriptionDraftStore>((set, get) => ({
  drafts: {},
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      const stored: Drafts = {};
      if (parsed && typeof parsed === 'object') {
        for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof value === 'string' && value.trim()) stored[id] = value;
        }
      }
      // Drafts set while loading win over stored ones.
      set((state) => ({ drafts: { ...stored, ...state.drafts }, loaded: true }));
    } catch {
      set({ loaded: true });
    }
  },
  setDraft: (businessId, text) => {
    const drafts = { ...get().drafts, [businessId]: text };
    set({ drafts });
    void persist(drafts);
  },
  clearDraft: (businessId) => {
    const { [businessId]: _removed, ...drafts } = get().drafts;
    set({ drafts });
    void persist(drafts);
  },
}));
