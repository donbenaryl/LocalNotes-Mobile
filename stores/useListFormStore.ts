import { create } from 'zustand';
import type { Location as GeoLocation } from '@/http/list-api/types';
import type { ListFormCategory, ListFormData, ListPickDraft, ShareOption } from '@/types/listForm';

export type ListFormMode = 'create' | 'edit';

const INITIAL_FORM: ListFormData = {
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

interface CreateDraft extends ListFormData {
  formTouched: boolean;
}

interface EditDraft extends ListFormData {
  sourceListId: string | null;
  hydratedListUpdatedAt: string | null;
  formTouched: boolean;
}

const INITIAL_CREATE: CreateDraft = {
  ...INITIAL_FORM,
  formTouched: false,
};

const INITIAL_EDIT: EditDraft = {
  ...INITIAL_FORM,
  sourceListId: null,
  hydratedListUpdatedAt: null,
  formTouched: false,
};

interface ListFormStore {
  create: CreateDraft;
  edit: EditDraft;

  setName: (mode: ListFormMode, name: string) => void;
  setLocation: (mode: ListFormMode, location?: GeoLocation) => void;
  setCategories: (mode: ListFormMode, categories: ListFormCategory[]) => void;
  setNotes: (mode: ListFormMode, notes: string) => void;
  setOthersName: (mode: ListFormMode, others_name: string) => void;
  setShareOption: (mode: ListFormMode, shareOption: ShareOption) => void;
  setAllowComments: (mode: ListFormMode, allowComments: boolean) => void;
  setAllowShare: (mode: ListFormMode, allowShare: boolean) => void;
  setSpecificUsers: (mode: ListFormMode, specificUsers: string[]) => void;
  setItems: (mode: ListFormMode, items: ListPickDraft[]) => void;
  addItem: (mode: ListFormMode, item: ListPickDraft) => void;
  updateItem: (mode: ListFormMode, id: number, item: ListPickDraft) => void;
  removeItem: (mode: ListFormMode, id: number) => void;
  patch: (mode: ListFormMode, data: Partial<ListFormData>) => void;

  hydrateFromList: (listId: string, data: ListFormData, updatedAt: string) => void;
  clearEditHydration: () => void;
  resetCreate: () => void;
  resetEdit: () => void;
  isDirty: (mode: ListFormMode) => boolean;
  getDraft: (mode: ListFormMode) => ListFormData;
}

export const useListFormStore = create<ListFormStore>((set, get) => ({
  create: { ...INITIAL_CREATE },
  edit: { ...INITIAL_EDIT },

  setName: (mode, name) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, name, formTouched: true } }
        : { edit: { ...s.edit, name, formTouched: true } },
    ),
  setLocation: (mode, location) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, location, formTouched: true } }
        : { edit: { ...s.edit, location, formTouched: true } },
    ),
  setCategories: (mode, categories) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, categories, formTouched: true } }
        : { edit: { ...s.edit, categories, formTouched: true } },
    ),
  setNotes: (mode, notes) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, notes, formTouched: true } }
        : { edit: { ...s.edit, notes, formTouched: true } },
    ),
  setOthersName: (mode, others_name) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, others_name, formTouched: true } }
        : { edit: { ...s.edit, others_name, formTouched: true } },
    ),
  setShareOption: (mode, shareOption) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, shareOption, formTouched: true } }
        : { edit: { ...s.edit, shareOption, formTouched: true } },
    ),
  setAllowComments: (mode, allowComments) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, allowComments, formTouched: true } }
        : { edit: { ...s.edit, allowComments, formTouched: true } },
    ),
  setAllowShare: (mode, allowShare) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, allowShare, formTouched: true } }
        : { edit: { ...s.edit, allowShare, formTouched: true } },
    ),
  setSpecificUsers: (mode, specificUsers) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, specificUsers, formTouched: true } }
        : { edit: { ...s.edit, specificUsers, formTouched: true } },
    ),
  setItems: (mode, items) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, items, formTouched: true } }
        : { edit: { ...s.edit, items, formTouched: true } },
    ),
  addItem: (mode, item) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, items: [...s.create.items, item], formTouched: true } }
        : { edit: { ...s.edit, items: [...s.edit.items, item], formTouched: true } },
    ),
  updateItem: (mode, id, item) =>
    set((s) => {
      const slot = mode === 'create' ? s.create : s.edit;
      const items = slot.items.map((existing) => (existing.id === id ? item : existing));
      return mode === 'create'
        ? { create: { ...s.create, items, formTouched: true } }
        : { edit: { ...s.edit, items, formTouched: true } };
    }),
  removeItem: (mode, id) =>
    set((s) => {
      const slot = mode === 'create' ? s.create : s.edit;
      const items = slot.items.filter((item) => item.id !== id);
      return mode === 'create'
        ? { create: { ...s.create, items, formTouched: true } }
        : { edit: { ...s.edit, items, formTouched: true } };
    }),
  patch: (mode, data) =>
    set((s) =>
      mode === 'create'
        ? { create: { ...s.create, ...data, formTouched: true } }
        : { edit: { ...s.edit, ...data, formTouched: true } },
    ),

  hydrateFromList: (listId, data, updatedAt) =>
    set({
      edit: {
        ...data,
        sourceListId: listId,
        hydratedListUpdatedAt: updatedAt,
        formTouched: false,
      },
    }),
  clearEditHydration: () =>
    set((s) => ({
      edit: {
        ...s.edit,
        sourceListId: null,
        hydratedListUpdatedAt: null,
      },
    })),
  resetCreate: () => set({ create: { ...INITIAL_CREATE } }),
  resetEdit: () => set({ edit: { ...INITIAL_EDIT } }),

  isDirty: (mode) => {
    if (mode === 'edit') {
      return get().edit.formTouched;
    }
    const c = get().create;
    return Boolean(
      c.name.trim() ||
        c.notes.trim() ||
        c.items.length ||
        c.categories.length ||
        c.location ||
        c.others_name.trim(),
    );
  },

  getDraft: (mode) => {
    const slot = mode === 'create' ? get().create : get().edit;
    const {
      name,
      location,
      categories,
      items,
      notes,
      others_name,
      shareOption,
      allowComments,
      allowShare,
      specificUsers,
    } = slot;
    return {
      name,
      location,
      categories,
      items,
      notes,
      others_name,
      shareOption,
      allowComments,
      allowShare,
      specificUsers,
    };
  },
}));
