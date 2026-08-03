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
  /** Backed by `NotificationSetting.spotlight_digest` — unlike the other keys above, this
   * one is synced to the backend (see `useAccountSettingsStore.ts`). */
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

export const DEFAULT_CONNECTED_PROVIDERS: ConnectedProvider[] = [
  {
    id: 'google',
    connected: true,
    reviewCount: 62,
    lastSyncedAt: '2h ago',
  },
  {
    id: 'yelp',
    connected: true,
    reviewCount: 19,
    lastSyncedAt: '3h ago',
  },
  {
    id: 'amazon',
    connected: false,
  },
  {
    id: 'tripadvisor',
    connected: false,
  },
];

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettingsPrefs = {
  notifications: DEFAULT_NOTIFICATION_PREFS,
  privacy: DEFAULT_PRIVACY_PREFS,
  connectedProviders: DEFAULT_CONNECTED_PROVIDERS,
};
