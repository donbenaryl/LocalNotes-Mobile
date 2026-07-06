import type {
  ConversationRequest,
  DetailedConversation,
  PreviousConversation,
} from '../types/smartPick';
import { useAuthStore } from '../stores/useAuthStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.localnotes.app';

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? 'Request failed');
  }

  return data as T;
}

export async function fetchConversations(): Promise<PreviousConversation[]> {
  return request<PreviousConversation[]>('/smart-pick/', { method: 'GET' });
}

export async function makeConversation(
  dto: ConversationRequest,
): Promise<DetailedConversation> {
  return request<DetailedConversation>('/smart-pick/', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function fetchDetailedConversation(
  sessionId: string,
): Promise<DetailedConversation> {
  return request<DetailedConversation>(`/smart-pick/sessions/${sessionId}`, {
    method: 'GET',
  });
}
