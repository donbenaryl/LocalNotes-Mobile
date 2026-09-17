import { create } from 'zustand';

interface ListDetailModalStore {
  listId: string | null;
  open: (listId: string) => void;
  close: () => void;
}

export const useListDetailModalStore = create<ListDetailModalStore>((set) => ({
  listId: null,
  open: (listId) => set({ listId }),
  close: () => set({ listId: null }),
}));
