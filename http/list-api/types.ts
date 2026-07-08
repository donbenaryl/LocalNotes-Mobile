export interface Tag {
  id:number;
  business?: string;
  new_tags: string[];
  description: string;
  unverified_business?:string;
}

export interface Account {
  id: string;
  name: string;
  profile_image: string | null;
  personality_color?: { [color: string]: number } | null;
  personality_name?: string | null;
}

export interface TagDAO {
  name: string;
  id: string;
}

export interface UnverifiedBusiness {
  name: string;
  id: string;
}
export interface BusinessBranchDAO {
  id: string;
  name: string;
  location?: Location | null;
}

export interface BusinessDAO {
  id: string;
  name: string;
  location?: string | null; // Optional
  branches?: BusinessBranchDAO[];
  status: string;
  business_type: string;
  contact_email: string;
  phone_number?: string; // Optional
  logo?: string | null; // Optional
  website?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}
export interface ListItemImage {
  id: string;
  url: string;
}

export interface Item {
  id: string;
  business: BusinessDAO | null;
  tags: TagDAO[];
  categories: string[];
  others_name?: string | null;
  description: string;
  account: string;
  owner?: Account;
  unverified_business: UnverifiedBusiness | null;
  images?: ListItemImage[];
  location?: Location | null;
  is_favorite?: boolean;
}
export interface Location {
  street_address?: string | null;
  postal_code?: string | null;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}
export interface Category {
  name: string;
  metadata: {
    list_count: number;
    updated_at: string; 
    pin_text: string;
  };
  id: string;
}

/** List item fields accepted by create/update list. Include ``id`` when updating so picks stay the same row (images preserved). */
export interface CreateListItemPayload {
  id?: string;
  business?: string;
  new_tags: string[];
  categories?: string[];
  others_name?: string;
  description: string;
  unverified_business?: string;
}

export interface CreateListDTO {
  name?: string;
  location?: Location;
  categories?: string[];
  items?: CreateListItemPayload[];
  notes?: string;
  privacy?: string;
  others_can_comment?: boolean;
  others_can_share?: boolean;
  shared_with?: string[];
  others_name?: string;
  status:string;
}
export interface ListItemDAO {
  id:string;
  name: string;
  location: Location;
  categories: string[];
  others_name?: string;
  comments: number;
  items: Item[];
  /** List cover image URL when set */
  image_url?: string | null;
  notes: string;
  privacy: string;
  others_can_comment: boolean;
  others_can_share: boolean;
  shared_with: string[];
  published_at?: string;
  /** Last modification time; compare to published/created when showing "updated" */
  updated_at?: string;
  saves:number;
  shares: number;
  is_published:boolean;
  is_pinned:boolean;
  created_at:string;
  likes:0;
  is_saved:boolean;
  is_liked:boolean;
  account: Account;
  personality_color:{
    [color:string]: number
  }
  personality_name?: string;
  status:string;
  account_is_followed:boolean;
}

export type ListDAO ={
  data: ListItemDAO[];
  message: string;
  pagination: {
    next: number | null;
    page: number;
    total: number;
  };
  success: boolean;
}

export interface serchDTO{
  query:string;
}
export interface listDTO{
  category:string;
  category_id?:string;  // List category
  user_id?: string;
}
export interface userListDTO{
  userId:string;
}

export interface listedDTO{
  status:string;
  category?:string;
}
export type communityPickItem = {
  id: string;
  name: string;
  notes: string;
  share_count: number;
  shares_summary: string;
  primary_image: string;
  created_at: string;
};

// types.ts - Add these types to your existing types file

export interface Comment {
  id: string;
  list: string;
  parent: string | null;
  content: string;
  account: Account;
  replies_count: number;
  created_at: string;
  likes_count: number;
  is_liked?: boolean; // Optional field for client-side state
}
export interface CreateCommentDTO {
  content: string;
  parent?: string;
}

export interface UpdateCommentDTO {
  content: string;
}

export interface CommentsPagination {
  page: number;
  parent?: string;
}

/** Shape returned by ListItemPublicSerializer (GET /lists/list-items) */
export interface ListItemPublic {
  id: string;
  business_name: string | null;
  business_id: string | null;
  is_verified: boolean;
  is_favorite: boolean;
  is_owner: boolean;
  owner: Account;
  description: string;
  tags: TagDAO[];
  categories: string[];
  others_name?: string | null;
  images: ListItemImage[];
  list_usage_count: number;
  location?: Location | null;
}

/** Payload for creating a standalone list item (POST /lists/items) */
export interface CreateListItemDTO {
  description: string;
  business?: string;
  new_tags?: string[];
  categories?: string[];
  others_name?: string;
  unverified_business?: string;
  location?: Location;
}

/** Payload for updating a standalone list item (PATCH /lists/items/<id>) */
export interface UpdateListItemDTO {
  description?: string;
  business?: string;
  new_tags?: string[];
  categories?: string[];
  others_name?: string;
  unverified_business?: string;
  location?: Location | null;
}