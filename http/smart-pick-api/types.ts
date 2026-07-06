
export interface Location {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface BusinessBranch {
  id: string;
  name: string | null;
  location: Location | null;
}

export interface Business {
  id: string;
  name: string;
  branches: BusinessBranch[];
  status: 'Unclaimed' | 'Claimed and Verified' | string;
  business_type: string | null;
  contact_email: string | null;
  phone_number: string | null;
  logo: string | null;
  website: string | null;
  bio: string | null;
  share_count: number;
  follower_count: number;
  list_count: number;
  is_followed: boolean;
}

export interface PickTag {
  id: string;
  name: string;
}

export interface PickImage {
  id: string;
  url: string;
}

export interface PickUser {
  id: string;
  name: string;
  profile_image_url: string | null;
  personality_name: string | null;
  personality_color: unknown | null;
  personality_tags: string | null;
  personality_description: string | null;
}

export interface Pick {
  id: string;
  description: string | null;
  tags: PickTag[];
  images: PickImage[];
  location: Location | null;
  business: Business | null;
  unverified_business: { id?: string; name: string } | null;
  user: PickUser | null;
}

export interface MatchComponent {
  component: string;
  score: number;
  weight_pct: number;
  contribution: number;
}

export interface MatchSummary {
  components: MatchComponent[];
  fatigue_multiplier: number;
  final_percentage: number;
}

export interface ConversationResult {
  id: string;
  description: string;
  ranking: number;
  match_percentage: number | null;
  match_summary: MatchSummary | null;
  pick: Pick | null;
}

export interface LinkedUser {
name: string; 
id: string; 
profile_image_url: string | null 
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

export interface WebResult {
  name: string;
  description: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  why_it_fits: string | null;
  image_url: string | null;
}

export interface DetailedConversation {
  id: string;
  messages: ConversationMessage[];
  linked_users: LinkedUser[];
  result_label: string;
  results: ConversationResult[];
  results_web?: WebResult[];
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



