import { create } from 'zustand';

interface ModalHostStore {
  depth: number;
  push: () => void;
  pop: () => void;
}

export const useModalHostStore = create<ModalHostStore>((set) => ({
  depth: 0,
  push: () => set((state) => ({ depth: state.depth + 1 })),
  pop: () => set((state) => ({ depth: Math.max(0, state.depth - 1) })),
}));
