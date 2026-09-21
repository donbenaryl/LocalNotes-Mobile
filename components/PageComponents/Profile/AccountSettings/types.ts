export type ConnectedProviderId = 'google' | 'yelp' | 'amazon' | 'tripadvisor';

export interface NotificationPrefs {
  likesAndSaves: boolean;
  newFollowers: boolean;
  mentions: boolean;
  commentsAndReplies: boolean;
  newLists: boolean;
  newPicks: boolean;
  businessOffers: boolean;
  featuredOffers: boolean;
  weeklyRecap: boolean;
  reengagementNudges: boolean;
  quietHours: boolean;
  /** Synced to `NotificationSetting.spotlight_digest`. */
  spotlightDigest: boolean;
}

export interface PrivacyPrefs {
  showHomeCity: boolean;
  showPersonalityName: boolean;
  appearInSearch: boolean;
  showInSmartPicks: boolean;
  allowMentionsFromAnyone: boolean;
  usePreciseLocation: boolean;
  showSavedList: boolean;
  showLikesAndComments: boolean;
}

export interface ConnectedProvider {
  id: ConnectedProviderId;
  connected: boolean;
  reviewCount?: number;
  lastSyncedAt?: string;
  syncStatus?: 'idle' | 'syncing' | 'failed';
  comingSoon?: boolean;
}

export interface AccountSettingsPrefs {
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
  connectedProviders: ConnectedProvider[];
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  likesAndSaves: true,
  newFollowers: true,
  mentions: true,
  commentsAndReplies: true,
  newLists: true,
  newPicks: false,
  businessOffers: true,
  featuredOffers: false,
  weeklyRecap: true,
  reengagementNudges: false,
  quietHours: true,
  spotlightDigest: true,
};

export const DEFAULT_PRIVACY_PREFS: PrivacyPrefs = {
  showHomeCity: true,
  showPersonalityName: true,
  appearInSearch: true,
  showInSmartPicks: true,
  allowMentionsFromAnyone: false,
  usePreciseLocation: true,
  showSavedList: false,
  showLikesAndComments: false,
};

/** Unconnected defaults — live status comes from GET /api/reviews/connections. */
export const DEFAULT_CONNECTED_PROVIDERS: ConnectedProvider[] = [
  { id: 'google', connected: false },
  { id: 'yelp', connected: false, comingSoon: true },
  { id: 'amazon', connected: false, comingSoon: true },
  { id: 'tripadvisor', connected: false, comingSoon: true },
];

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettingsPrefs = {
  notifications: DEFAULT_NOTIFICATION_PREFS,
  privacy: DEFAULT_PRIVACY_PREFS,
  connectedProviders: DEFAULT_CONNECTED_PROVIDERS,
};
