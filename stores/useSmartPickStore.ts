import { create } from 'zustand';
import type { DetailedConversation, PreviousConversation } from '../types/smartPick';

interface SmartPickState {
  previousConversations: PreviousConversation[];
  currentConversation: DetailedConversation | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface SmartPickActions {
  setPreviousConversations: (conversations: PreviousConversation[]) => void;
  setCurrentConversation: (conversation: DetailedConversation | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
}

const initialState: SmartPickState = {
  previousConversations: [],
  currentConversation: null,
  loading: false,
  error: null,
  success: false,
};

export const useSmartPickStore = create<SmartPickState & SmartPickActions>((set) => ({
  ...initialState,
  setPreviousConversations: (conversations) => set({ previousConversations: conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  reset: () => set(initialState),
}));
