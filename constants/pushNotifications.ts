/** Expo notification category IDs — must match backend `utils/notifications.py`. */
export const PUSH_CATEGORY_LIST_ACTIVITY = 'LIST_ACTIVITY';
export const PUSH_CATEGORY_DEFAULT = 'DEFAULT';

export const PUSH_ACTION_DISMISS = 'DISMISS';
export const PUSH_ACTION_REACT = 'REACT';

/** Must stay in sync with backend `LIST_ACTIVITY_NOTIFICATION_TYPES`. */
export const LIST_ACTIVITY_NOTIFICATION_TYPES = [
  'FOLLOWED_USER_NEW_LIST',
] as const;

export type ListActivityNotificationType =
  (typeof LIST_ACTIVITY_NOTIFICATION_TYPES)[number];
