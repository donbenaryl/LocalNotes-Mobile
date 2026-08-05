/** Expo notification category IDs — must match backend `utils/notifications.py`. */
export const PUSH_CATEGORY_LIST_ACTIVITY = 'LIST_ACTIVITY';
export const PUSH_CATEGORY_DEFAULT = 'DEFAULT';

export const PUSH_ACTION_DISMISS = 'DISMISS';
export const PUSH_ACTION_REACT = 'REACT';

export const LIST_ACTIVITY_NOTIFICATION_TYPES = [
  'LIST_WAS_LIKED',
  'LIST_WAS_SAVED',
  'LIST_COMMENTED',
  'COMMENT_REPLY',
  'COMMENT_LIKED',
  'COMMENT_MENTION',
  'FOLLOWED_USER_NEW_LIST',
  'FOLLOWED_USER_LIST_UPDATED',
  'FOLLOWED_USER_NEW_LIST_ITEM',
  'FOLLOWED_USER_LIST_ITEM_UPDATED',
] as const;

export type ListActivityNotificationType =
  (typeof LIST_ACTIVITY_NOTIFICATION_TYPES)[number];
