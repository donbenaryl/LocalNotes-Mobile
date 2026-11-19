import { create } from 'zustand';
import type { ViewOrigin } from '@/http/types';

interface OfferDetailModalStore {
  noteId: string | null;
  viewOrigin: ViewOrigin | null;
  open: (noteId: string, origin?: ViewOrigin) => void;
  close: () => void;
}

export const useOfferDetailModalStore = create<OfferDetailModalStore>((set) => ({
  noteId: null,
  viewOrigin: null,
  open: (noteId, origin) => set({ noteId, viewOrigin: origin ?? null }),
  close: () => set({ noteId: null, viewOrigin: null }),
}));
