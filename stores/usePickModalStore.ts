import { create } from 'zustand';

interface PickModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const usePickModalStore = create<PickModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
