import type {
  NotificationPrefs,
  PrivacyPrefs,
} from "@/components/PageComponents/Profile/AccountSettings/types";

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
  is_blocked?: boolean;
  is_muted?: boolean;
  is_superuser?: boolean;
  url_linkedin?: string | null;
  url_facebook?: string | null;
  url_instagram?: string | null;
  show_saved_lists?: boolean;
  show_saved_list?: boolean;
  show_contributed_lists?: boolean;
  show_shared_with_me?: boolean;
  location_id?: string | null;
  location?: AccountLocationDTO | null;
  /** Present when account_type is business */
  primary_business_id?: string | null;
  primary_business_name?: string | null;
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
  username?: string;
  first_name?: string;
  last_name?: string;
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

export interface peopleDiscoverySearchDTO{
  query?: string;
  matchMin?: number;
  matchMax?: number;
  /** TraitSide slugs; AND across all selected sides. See `personality_sides` API param. */
  personalitySides?: string[];
  limit?: number;
  offset?: number;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

/** Response from GET /accounts/search/match-histogram. */
export interface MatchHistogramDAO {
  bins: number[];
  total: number;
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

export interface usernameAvailableDTO {
  username: string;
}

export interface usernameAvailableDAO {
  username: string;
  available: boolean;
}

export interface MentionSearchDTO {
  q: string;
}

export interface MentionSearchResultItem {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string | null;
}

export interface MentionSearchDAO {
  query: string;
  results: MentionSearchResultItem[];
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

type RelatedListItem = {
  id: string;
};


export interface notificationItemDAO {
  notification_type: string;
  related_account: RelatedAccount | null;
  related_list: RelatedList | null;
  related_list_item: RelatedListItem | null;
  text: string | null;
  created_at: string;
  id: string;
  is_read: boolean;
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

/**
 * Mirrors backend `NotificationSetting` / `NotificationSettingSerializer`.
 * Pref toggles sync via GET/PATCH `/accounts/notification-settings`.
 */
export interface NotificationSettingsDAO {
  likes_and_saves: boolean;
  new_followers: boolean;
  mentions: boolean;
  comments_and_replies: boolean;
  new_lists: boolean;
  new_picks: boolean;
  business_offers: boolean;
  featured_offers: boolean;
  spotlight_digest: boolean;
  weekly_recap: boolean;
  reengagement_nudges: boolean;
  quiet_hours: boolean;
  timezone: string;
}

export type UpdateNotificationSettingsDTO = Partial<NotificationSettingsDAO>;

export interface RegisterNotificationTokenDTO {
  token: string;
}

export interface PrivacySettingsDAO {
  show_home_city: boolean;
  show_personality_name: boolean;
  appear_in_search: boolean;
  show_in_smart_picks: boolean;
  allow_mentions_from_anyone: boolean;
  use_precise_location: boolean;
  show_saved_list: boolean;
  show_likes_and_comments: boolean;
}

export type UpdatePrivacySettingsDTO = Partial<PrivacySettingsDAO>;

export type AccountReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "sexual_content"
  | "dangerous"
  | "minor_sexual_content"
  | "impersonation"
  | "other";

export type ReportContentType = "profile" | "list" | "pick";

export interface ReportUserDTO {
  reason: AccountReportReason;
  details?: string;
  content_type?: ReportContentType;
  content_id?: string;
}

export interface BlockedAccountDAO {
  id: string;
  name: string;
  username?: string | null;
  profile_image_url?: string | null;
}

export function mapNotificationSettingsDAOToPrefs(
  dao: NotificationSettingsDAO,
): NotificationPrefs {
  return {
    likesAndSaves: dao.likes_and_saves,
    newFollowers: dao.new_followers,
    mentions: dao.mentions,
    commentsAndReplies: dao.comments_and_replies,
    newLists: dao.new_lists,
    newPicks: dao.new_picks,
    businessOffers: dao.business_offers,
    featuredOffers: dao.featured_offers,
    spotlightDigest: dao.spotlight_digest,
    weeklyRecap: dao.weekly_recap,
    reengagementNudges: dao.reengagement_nudges,
    quietHours: dao.quiet_hours,
  };
}

export function mapNotificationPrefsToDAO(
  prefs: Partial<NotificationPrefs>,
  timezone?: string,
): UpdateNotificationSettingsDTO {
  const dto: UpdateNotificationSettingsDTO = {};
  if (prefs.likesAndSaves !== undefined) dto.likes_and_saves = prefs.likesAndSaves;
  if (prefs.newFollowers !== undefined) dto.new_followers = prefs.newFollowers;
  if (prefs.mentions !== undefined) dto.mentions = prefs.mentions;
  if (prefs.commentsAndReplies !== undefined) {
    dto.comments_and_replies = prefs.commentsAndReplies;
  }
  if (prefs.newLists !== undefined) dto.new_lists = prefs.newLists;
  if (prefs.newPicks !== undefined) dto.new_picks = prefs.newPicks;
  if (prefs.businessOffers !== undefined) dto.business_offers = prefs.businessOffers;
  if (prefs.featuredOffers !== undefined) dto.featured_offers = prefs.featuredOffers;
  if (prefs.spotlightDigest !== undefined) dto.spotlight_digest = prefs.spotlightDigest;
  if (prefs.weeklyRecap !== undefined) dto.weekly_recap = prefs.weeklyRecap;
  if (prefs.reengagementNudges !== undefined) {
    dto.reengagement_nudges = prefs.reengagementNudges;
  }
  if (prefs.quietHours !== undefined) dto.quiet_hours = prefs.quietHours;
  if (timezone !== undefined) dto.timezone = timezone;
  return dto;
}

export function mapPrivacySettingsDAOToPrefs(dao: PrivacySettingsDAO): PrivacyPrefs {
  return {
    showHomeCity: dao.show_home_city,
    showPersonalityName: dao.show_personality_name,
    appearInSearch: dao.appear_in_search,
    showInSmartPicks: dao.show_in_smart_picks,
    allowMentionsFromAnyone: dao.allow_mentions_from_anyone,
    usePreciseLocation: dao.use_precise_location,
    showSavedList: dao.show_saved_list,
    showLikesAndComments: dao.show_likes_and_comments,
  };
}

export function mapPrivacyPrefsToDAO(
  prefs: Partial<PrivacyPrefs>,
): UpdatePrivacySettingsDTO {
  const dto: UpdatePrivacySettingsDTO = {};
  if (prefs.showHomeCity !== undefined) dto.show_home_city = prefs.showHomeCity;
  if (prefs.showPersonalityName !== undefined) {
    dto.show_personality_name = prefs.showPersonalityName;
  }
  if (prefs.appearInSearch !== undefined) dto.appear_in_search = prefs.appearInSearch;
  if (prefs.showInSmartPicks !== undefined) dto.show_in_smart_picks = prefs.showInSmartPicks;
  if (prefs.allowMentionsFromAnyone !== undefined) {
    dto.allow_mentions_from_anyone = prefs.allowMentionsFromAnyone;
  }
  if (prefs.usePreciseLocation !== undefined) dto.use_precise_location = prefs.usePreciseLocation;
  if (prefs.showSavedList !== undefined) dto.show_saved_list = prefs.showSavedList;
  if (prefs.showLikesAndComments !== undefined) {
    dto.show_likes_and_comments = prefs.showLikesAndComments;
  }
  return dto;
}