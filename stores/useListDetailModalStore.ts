import { create } from 'zustand';
import type { ViewOrigin } from '@/http/types';

interface ListDetailModalStore {
  listId: string | null;
  viewOrigin: ViewOrigin | null;
  open: (listId: string, origin?: ViewOrigin) => void;
  close: () => void;
}

export const useListDetailModalStore = create<ListDetailModalStore>((set) => ({
  listId: null,
  viewOrigin: null,
  open: (listId, origin) => set({ listId, viewOrigin: origin ?? null }),
  close: () => set({ listId: null, viewOrigin: null }),
}));
