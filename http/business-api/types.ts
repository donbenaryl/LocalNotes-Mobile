
export type BusinessLocation = {
  street_address: string;
  postal_code: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type BusinessBranchDAO = {
  id: string;
  name: string;
  location: BusinessLocation;
};

export type BusinessItemDAO = {
  id: string;
  name: string;
  /** Present on some API payloads; search uses `branches[].location` instead. */
  location?: BusinessLocation;
  status: string;
  business_type: string;
  contact_email: string;
  phone_number: string;
  website?: string;
  logo: string;
  bio?: string;
  branches: BusinessBranchDAO[];
  is_followed?: boolean;
  list_count: number;
  share_count?: number;
  follower_count?: number;
};

export type BusinessDAO= {
    data:BusinessItemDAO[]
    message: string;
    pagination: {
        next: number | null;
        page: number;
        total: number;
    };
    success: boolean;
}

export interface searchBusinessDTO{
  query:string;
}

export interface UpdateBusinessDTO {
  name?: string;
  business_type?: string;
  contact_email?: string;
  phone_number?: string;
  website?: string;
  bio?: string;
}

export interface AddBranchDTO {
  name: string;
  location: BusinessLocation;
}

export type BusinessViewsStatsDAO = {
  total_views: number;
};

export type BusinessMentionsStatsDAO = {
  total_mentions: number;
};

export type BusinessCategoryStatItemDAO = {
  category_id: string;
  category_name: string;
  list_count: number;
};

export type BusinessPersonalityColorStatItemDAO = {
  color: string;
  color_name: string;
  user_count: number;
  percentage: number;
};

export type BusinessListStatItemDAO = {
  id: string;
  name: string;
  status: string;
  privacy: string;
  created_at: string;
  followers_count: number;
  profile_image_url: string | null;
  first_name: string;
  last_name: string;
  user_name: string;
};

export type BusinessUniqueUsersReachedStatsDAO = {
  unique_users_reached: number;
};

export type BusinessTotalListSavesStatsDAO = {
  total_list_saves: number;
};

export type StatsDateRangeParams = {
  date_from?: string;
  date_to?: string;
};