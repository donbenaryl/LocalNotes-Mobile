import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warn';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

export interface ShowToastInput {
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastData[];
  show: (input: ShowToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_VISIBLE_TOASTS = 3;

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  error: 5000,
  warn: 5000,
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  show: (input) => {
    const id = generateId();
    const duration = input.duration ?? DEFAULT_DURATION[input.type];

    set((state) => {
      const next: ToastData[] = [
        { id, type: input.type, title: input.title, message: input.message, duration },
        ...state.toasts,
      ];

      return { toasts: next.slice(0, MAX_VISIBLE_TOASTS) };
    });

    return id;
  },

  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clear: () => {
    set({ toasts: [] });
  },
}));
