export interface SmartPickLocation {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Business {
  id: string;
  name: string;
  location: SmartPickLocation | null;
  status: 'Unclaimed' | 'Claimed' | 'Verified' | string;
  business_type: string;
  contact_email: string;
  phone_number: string;
  logo: string | null;
}

export interface ScoreBreakdown {
  personality: number;
  behavior: number;
  context: number;
  list_signal: number;
  quality: number;
  ai_signal: number;
}

export interface ConversationResult {
  business: Business | null;
  unverified_business: { name: string } | null;
  description: string;
  id: string;
  ranking: number;
  smart_score?: number;
  score_breakdown?: ScoreBreakdown;
}

export interface LinkedUser {
  name: string;
  id: string;
  profile_image_url: string | null;
}

export type SenderType = 'SMART_PICK' | 'USER' | 'SYSTEM';
export type MessageType = 'OCCASION' | 'RESPONSE' | 'QUERY' | 'CONFIRMATION' | string;
export type OrientationType = 'PERSONALITY' | 'LOCATION' | 'PRICE' | 'CUISINE' | string;

export interface ConversationMessage {
  message: string;
  created_at: string;
  id: string;
  sender: SenderType;
  message_type: MessageType;
}

export interface DetailedConversation {
  id: string;
  messages: ConversationMessage[];
  linked_users?: LinkedUser[];
  result_label: string;
  results: ConversationResult[];
  is_free_text: boolean;
}

export interface PreviousConversation {
  id: string;
  label: string;
  created_at: string;
}

export interface ConversationRequest {
  occassion: string;
  time_of_day: string;
  orientation: OrientationType;
  personality: string | null;
  vibe: string | null;
  linked_users: string[];
  is_free_text: boolean;
  lat?: number;
  lng?: number;
  preferred_radius_km?: number;
}
