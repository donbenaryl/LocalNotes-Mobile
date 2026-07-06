import type { BusinessItemDAO } from "../business-api/types";

export interface NoteMediaDAO {
  id: string;
  url: string;
  media_type: "image" | "video";
  created_at: string;
}

export interface NoteCategoryDAO {
  id: string;
  name: string;
  created_at: string;
  others_name?: string;
}

export type Visibility = "Public" | "Friends" | "Private" | "Specific People";

export interface NoteDAO {
  id: string;
  title: string;
  description: string | null;
  expires_at: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  media: NoteMediaDAO[];
  categories: NoteCategoryDAO[];
  view_count?: number;
  share_count?: number;
  like_count?: number;
  is_liked?: boolean;
  is_shared?: boolean;
  is_viewed?: boolean;
  business: BusinessItemDAO;
  others_name?: string | null;
}

export interface UpsertNoteDTO {
  title?: string;
  description?: string;
  expires_at?: string | null;
  visibility?: Visibility;
  business_id: string;
  category_ids?: string[];
  others_name?: string;
}
