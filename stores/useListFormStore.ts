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
  sourceListId: string | null;
  hydratedListUpdatedAt: string | null;
  formTouched: boolean;
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
  hydrateFromList: (listId: string, data: ListFormData, updatedAt: string) => void;
  clearEditHydration: () => void;
  reset: () => void;
  isDirty: () => boolean;
}

export const useListFormStore = create<ListFormStore>((set, get) => ({
  ...INITIAL_STATE,
  sourceListId: null,
  hydratedListUpdatedAt: null,
  formTouched: false,

  setName: (name) => set({ name, formTouched: true }),
  setLocation: (location) => set({ location, formTouched: true }),
  setCategories: (categories) => set({ categories, formTouched: true }),
  setNotes: (notes) => set({ notes, formTouched: true }),
  setOthersName: (others_name) => set({ others_name, formTouched: true }),
  setShareOption: (shareOption) => set({ shareOption, formTouched: true }),
  setAllowComments: (allowComments) => set({ allowComments, formTouched: true }),
  setAllowShare: (allowShare) => set({ allowShare, formTouched: true }),
  setSpecificUsers: (specificUsers) => set({ specificUsers, formTouched: true }),
  setItems: (items) => set({ items, formTouched: true }),
  addItem: (item) =>
    set((s) => ({ items: [...s.items, item], formTouched: true })),
  updateItem: (id, item) =>
    set((s) => ({
      items: s.items.map((existing) => (existing.id === id ? item : existing)),
      formTouched: true,
    })),
  removeItem: (id) =>
    set((s) => ({
      items: s.items.filter((item) => item.id !== id),
      formTouched: true,
    })),
  patch: (data) => set({ ...data, formTouched: true }),
  hydrateFromList: (listId, data, updatedAt) =>
    set({
      ...data,
      sourceListId: listId,
      hydratedListUpdatedAt: updatedAt,
      formTouched: false,
    }),
  clearEditHydration: () =>
    set({ sourceListId: null, hydratedListUpdatedAt: null }),
  reset: () =>
    set({
      ...INITIAL_STATE,
      sourceListId: null,
      hydratedListUpdatedAt: null,
      formTouched: false,
    }),
  isDirty: () => {
    const s = get();
    if (s.sourceListId) {
      return s.formTouched;
    }
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
