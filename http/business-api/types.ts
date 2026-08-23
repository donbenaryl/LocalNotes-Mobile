import type { RNFile } from "../types";

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
  query?:string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  /** Keyword/name-only matching for autocomplete; skips semantic vector hits. */
  match?: "name";
}

export interface UpdateBusinessDTO {
  name?: string;
  business_type?: string;
  contact_email?: string;
  phone_number?: string;
  website?: string;
  bio?: string;
}

export type BusinessTypeDAO = {
  id: string;
  name: string;
};

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

export type OwnedBusinessDAO = {
  id: string;
  name: string;
  role: string;
  is_primary: boolean;
  location_count: number;
  branches: BusinessBranchDAO[];
};

export type StatsDateRangeParams = {
  date_from?: string;
  date_to?: string;
};

export type ClaimStatus = "Pending" | "Approved" | "Rejected";

export type ClaimSource =
  | "Existing Business"
  | "List Item - Existing Business"
  | "List Item - Unverified";

export type ClaimVerificationMethod = "email" | "phone" | "document";

export type ClaimAccountDAO = {
  id: string;
  name: string;
  email: string;
};

export type UnverifiedBusinessItemDAO = {
  id: string;
  name: string;
};

export type BusinessClaimDAO = {
  id: string;
  source: ClaimSource;
  status: ClaimStatus;
  target_name: string | null;
  business: BusinessItemDAO | null;
  claimant: ClaimAccountDAO | null;
  work_email: string | null;
  phone_number: string | null;
  proof_of_ownership: string | null;
  preview_image: string | null;
  verification_method: ClaimVerificationMethod;
  otp_verified_at: string | null;
  created_at: string;
  rejection_note: string | null;
  handler: ClaimAccountDAO | null;
  list_item_id: string | null;
  proposed_name: string | null;
  proposed_business_type: string | null;
  proposed_website: string | null;
  proposed_location: BusinessLocation | null;
  unverified_business: UnverifiedBusinessItemDAO | null;
  current_owners?: {
    id: string;
    name: string | null;
    email: string | null;
  }[];
};

export type ClaimableBusinessDAO = BusinessItemDAO;

export type ClaimablePickDAO = {
  id: string;
  name: string | null;
  description: string | null;
  business: BusinessItemDAO | null;
  unverified_business: UnverifiedBusinessItemDAO | null;
  images?: { id: string; url: string }[] | null;
  location?: BusinessLocation | null;
};

export type SearchClaimableDTO = {
  query?: string;
  page?: number;
};

export type SubmitClaimDTO = {
  work_email: string;
  proof_of_ownership: RNFile;
  verification_method?: ClaimVerificationMethod;
  phone_number?: string;
  business?: string;
  list_item?: string;
  /** Hint for backend serializer selection; also send list_item for pick claims. */
  source?: ClaimSource | "list_item" | "pick";
  proposed_name?: string;
  proposed_business_type?: string;
  proposed_website?: string;
  proposed_location?: BusinessLocation;
};

export type ClaimOtpTargetDTO = {
  business?: string;
  list_item?: string;
};

export type ClaimOtpVerifyDTO = ClaimOtpTargetDTO & {
  otp_code: string;
};

export type ClaimEmailOtpStartDAO = {
  masked_email: string;
  expires_at: string;
};

export type ClaimPhoneOtpStartDAO = {
  masked_phone: string;
  expires_at: string;
};