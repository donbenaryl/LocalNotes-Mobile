import type { Location as GeoLocation } from '@/http/list-api/types';
import type { RNFile } from '@/http/types';

export type ShareOption = 'Public' | 'Friends' | 'Private' | 'Specific People';

export interface ListPickDraft {
  id: number;
  serverItemId?: string;
  linkedFromLibrary?: boolean;
  businessDisplayName?: string;
  existingImages?: { id: string; url: string }[];
  business?: string;
  new_tags: string[];
  description: string;
  unverified_business?: string;
  location?: GeoLocation;
  newFiles?: RNFile[];
  ownerPersonalityColor?: Record<string, number> | null;
  owner?: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

export interface ListFormCategory {
  id: string;
  name: string;
}

export interface ListFormData {
  name: string;
  location?: GeoLocation;
  categories: ListFormCategory[];
  items: ListPickDraft[];
  notes: string;
  others_name: string;
  shareOption: ShareOption;
  allowComments: boolean;
  allowShare: boolean;
  specificUsers: string[];
}
