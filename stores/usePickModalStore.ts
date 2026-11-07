import { create } from 'zustand';
import type { ListItemPublic } from '@/http/list-api/types';

interface PickModalStore {
  isOpen: boolean;
  /** One-shot event: the pick just created from the modal, until a consumer clears it. */
  lastCreatedPick: ListItemPublic | null;
  open: () => void;
  close: () => void;
  publishCreatedPick: (pick: ListItemPublic) => void;
  clearCreatedPick: () => void;
}

export const usePickModalStore = create<PickModalStore>((set) => ({
  isOpen: false,
  lastCreatedPick: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  publishCreatedPick: (pick) => set({ lastCreatedPick: pick }),
  clearCreatedPick: () => set({ lastCreatedPick: null }),
}));
