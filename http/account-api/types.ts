export interface AccountLocationDTO {
  city: string;
  region?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  street_address?: string | null;
  postal_code?: string | null;
}

export interface profileItemDAO {
  /** Present on some account responses (e.g. other user profile). */
  id?: string;
  name: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  account_type: string;
  website?: string;
  followers_count: number;
  followed_count: number;
  total_likes: number;
  bio?: string;
  list_count?: string;
  profile_image_url:string;
  personality_name?: string | null;
  personality_color?: Record<string, number> | null;
  created_at?: string;
  date_of_birth?: string | null;
  /** Whether the current session follows this account (when applicable). */
  is_followed?: boolean;
  is_superuser?: boolean;
  url_linkedin?: string | null;
  url_facebook?: string | null;
  url_instagram?: string | null;
  show_saved_lists?: boolean;
  show_contributed_lists?: boolean;
  show_shared_with_me?: boolean;
  location_id?: string | null;
  location?: AccountLocationDTO | null;
}

export type profileDAO = {
  success: boolean;
  message: string;
  data: profileItemDAO;
};

export type personalityDAO = {
  success: boolean;
  message: string;
  data: UserProfileData;
};

interface ColorBreakdown {
  [color: string]: number; // Dynamic keys for hex colors with percentage values
}

interface TraitSide {
  label: string;
  color: string;
  slug: string;
}

interface Trait {
  id: string;
  left_side: TraitSide;
  right_side: TraitSide;
}

interface TraitScore {
  trait: Trait;
  left_value: number;
  right_value: number;
}

export interface UserProfileData {
  color_breakdown: ColorBreakdown;
  trait_scores: TraitScore[];
  tags:string;
  description:string;
}
export interface updateAccountDTO {
  bio?: string;
  name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  url_linkedin?: string | null;
  url_facebook?: string | null;
  url_instagram?: string | null;
  show_saved_lists?: boolean;
  show_contributed_lists?: boolean;
  show_shared_with_me?: boolean;
  location?: AccountLocationDTO | null;
}
export interface completeOnboardingIndividualDTO {
  user_type: "individual";
  name: string;
  password: string;
  date_of_birth: string;
}

export type completeOnboardingDTO = completeOnboardingIndividualDTO | FormData;
export interface topCreatorItem {
  id: string;
  name: string;
  profile_image_url: string;
  account_type: string;
  followers_count: number;
  is_followed: boolean;
  list_count: number;
  personality_name?: string | null;
  personality_color?: Record<string, number> | null;
  bio?: string | null;
}

export interface topCreatorDAO{
  sucess:boolean;
  message:string;
  data:topCreatorItem[]
}

export interface newCreatorItem {
  id: string;
  name: string;
  profile_image: string;
  account_type: string;
  followers_count: number;
  is_followed: boolean;
  num_list:number;
  follows_summary:string;
}

export interface searchUserDTO{
  q:string;
}
export interface searchUserDAO{
  id:string;
  name:string;
}

export interface usernameSearchDTO {
  username: string;
}

export interface usernameSearchResultItem {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string | null;
}

export interface usernameSearchDAO {
  query: string;
  available: boolean;
  results: usernameSearchResultItem[];
}

export interface notificationDTO{
  page:number
} 

type RelatedAccount = {
  account_is_followed: boolean;
  id: string;
  name: string;
  profile_image: string | null;
};

type RelatedList = {
  id: string;
  name: string;
};


export interface notificationItemDAO{
    notification_type: string; 
  related_account: RelatedAccount;
  related_list: RelatedList;
  text: string | null;            
    created_at: string;        
    id: string;
    read?: boolean;
 }

export type notificationDAO = {
  success: boolean;
  message: string;
  data: notificationItemDAO[];
  pagination: {
    page: number;  
    next: number;  
    total: number; 
  };
};