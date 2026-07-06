import { create } from 'zustand';
import type { Location as GeoLocation } from '@/http/list-api/types';
import type { ListFormCategory, ListFormData, ListPickDraft, ShareOption } from '@/types/listForm';

const INITIAL_STATE: ListFormData = {
  name: '',
  location: undefined,
  categories: [],
  items: [],
  notes: '',
  others_name: '',
  shareOption: 'Public',
  allowComments: true,
  allowShare: true,
  specificUsers: [],
};

interface ListFormStore extends ListFormData {
  setName: (name: string) => void;
  setLocation: (location?: GeoLocation) => void;
  setCategories: (categories: ListFormCategory[]) => void;
  setNotes: (notes: string) => void;
  setOthersName: (others_name: string) => void;
  setShareOption: (shareOption: ShareOption) => void;
  setAllowComments: (allowComments: boolean) => void;
  setAllowShare: (allowShare: boolean) => void;
  setSpecificUsers: (specificUsers: string[]) => void;
  setItems: (items: ListPickDraft[]) => void;
  addItem: (item: ListPickDraft) => void;
  updateItem: (id: number, item: ListPickDraft) => void;
  removeItem: (id: number) => void;
  patch: (data: Partial<ListFormData>) => void;
  reset: () => void;
  isDirty: () => boolean;
}

export const useListFormStore = create<ListFormStore>((set, get) => ({
  ...INITIAL_STATE,

  setName: (name) => set({ name }),
  setLocation: (location) => set({ location }),
  setCategories: (categories) => set({ categories }),
  setNotes: (notes) => set({ notes }),
  setOthersName: (others_name) => set({ others_name }),
  setShareOption: (shareOption) => set({ shareOption }),
  setAllowComments: (allowComments) => set({ allowComments }),
  setAllowShare: (allowShare) => set({ allowShare }),
  setSpecificUsers: (specificUsers) => set({ specificUsers }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, item) =>
    set((s) => ({
      items: s.items.map((existing) => (existing.id === id ? item : existing)),
    })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
  patch: (data) => set(data),
  reset: () => set({ ...INITIAL_STATE }),
  isDirty: () => {
    const s = get();
    return Boolean(
      s.name.trim() ||
        s.notes.trim() ||
        s.items.length ||
        s.categories.length ||
        s.location ||
        s.others_name.trim(),
    );
  },
}));
