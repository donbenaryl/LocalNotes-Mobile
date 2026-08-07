import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import {
  PUSH_ACTION_DISMISS,
  PUSH_ACTION_REACT,
  PUSH_CATEGORY_DEFAULT,
  PUSH_CATEGORY_LIST_ACTIVITY,
} from '@/constants/pushNotifications';
import listService from '@/http/list-api/list.service';
import { parseRichPushData, type RichPushData } from '@/types/pushNotification';

let categoriesRegistered = false;
let responseListener: Notifications.EventSubscription | null = null;
let linkingSubscription: { remove: () => void } | null = null;
/** Prevents double-like (toggle) when cold-start URL is delivered twice. */
let lastHandledPushReactKey: string | null = null;
let lastHandledPushReactAt = 0;

/**
 * Show banners while the app is foregrounded — without this, Expo accepts the
 * push but iOS often shows nothing when LocalNotes is open.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Android parity for rich pushes:
 * - HIGH importance channel (heads-up)
 * - LIST_ACTIVITY category actions (Dismiss / React) — Android only; iOS uses
 *   in-card buttons in the notification content extension
 * - Backend sends `richContent.image` + `priority: high` for large image / urgency
 * Custom RemoteViews matching the iOS Content Extension are intentionally out of scope.
 */
export async function ensurePushCategoriesRegistered(): Promise<void> {
  if (categoriesRegistered) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'LocalNotes',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B2C',
      showBadge: true,
    });
  }

  // iOS: empty actions so the system does not draw a second row under the
  // in-card Dismiss / React buttons in the content extension.
  const listActivityActions: Notifications.NotificationAction[] =
    Platform.OS === 'android'
      ? [
          {
            identifier: PUSH_ACTION_DISMISS,
            buttonTitle: 'Dismiss',
            options: {
              opensAppToForeground: false,
              isDestructive: true,
            },
          },
          {
            identifier: PUSH_ACTION_REACT,
            buttonTitle: 'React',
            options: {
              opensAppToForeground: true,
            },
          },
        ]
      : [];

  await Notifications.setNotificationCategoryAsync(
    PUSH_CATEGORY_LIST_ACTIVITY,
    listActivityActions,
  );

  // Explicit default category with no actions (some Android OEMs require registration).
  await Notifications.setNotificationCategoryAsync(PUSH_CATEGORY_DEFAULT, []);

  categoriesRegistered = true;
}

export function extractListIdFromDeepLink(deepLink: string | null | undefined): string | null {
  const link = deepLink?.trim();
  if (!link?.startsWith('/lists/')) return null;
  const listId = link.replace('/lists/', '').split('/')[0]?.split('?')[0];
  return listId || null;
}

function resolveDeepLink(data: RichPushData): Href | null {
  const link = data.deepLink?.trim();
  if (!link) return null;

  if (link.startsWith('/lists/')) {
    const listId = extractListIdFromDeepLink(link);
    if (listId) {
      return `/(app)/(stack)/lists/${listId}` as Href;
    }
  }
  if (link.startsWith('/profile/')) {
    const userId = link.replace('/profile/', '').split('/')[0];
    if (userId) {
      return `/profile/${userId}` as Href;
    }
  }
  if (link === '/home/spotlight' || link.startsWith('/home/spotlight')) {
    return '/(app)/(tabs)/home/spotlight' as Href;
  }
  if (link === '/home/offers' || link.startsWith('/home/offers')) {
    return '/(app)/(tabs)/home/offers' as Href;
  }
  if (link === '/notifications' || link.startsWith('/notifications')) {
    return '/(app)/(stack)/notifications' as Href;
  }

  return null;
}

export function navigateFromPushData(data: RichPushData): void {
  const href = resolveDeepLink(data);
  if (href) {
    router.push(href);
    return;
  }
  router.push('/(app)/(stack)/notifications' as Href);
}

function navigateToList(listId: string): void {
  router.push(`/(app)/(stack)/lists/${listId}` as Href);
}

/** Like the list (best-effort), then open it. Used by React push action. */
export async function reactToListFromPush(listId: string): Promise<void> {
  try {
    await listService.likeUnlikeList(listId);
  } catch (error) {
    console.error('Failed to like list from push React action:', error);
  }
  navigateToList(listId);
}

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const actionId = response.actionIdentifier;
  const data = parseRichPushData(response.notification.request.content.data);

  if (actionId === PUSH_ACTION_DISMISS) {
    // System dismisses the notification; no navigation.
    return;
  }

  if (actionId === PUSH_ACTION_REACT) {
    const listId = extractListIdFromDeepLink(data.deepLink);
    if (listId) {
      void reactToListFromPush(listId);
      return;
    }
    navigateFromPushData(data);
    return;
  }

  // Default tap → open the related list / deep link (no like).
  navigateFromPushData(data);
}

/** Parse `localnotes://push-react?listId=...` from the iOS content extension. */
export function parsePushReactUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'localnotes:') return null;
    // Host may be "push-react" (localnotes://push-react?listId=) or path "/push-react"
    const hostOrPath = `${parsed.host}${parsed.pathname}`.replace(/\/+$/, '');
    if (hostOrPath !== 'push-react' && hostOrPath !== '/push-react') {
      return null;
    }
    const listId = parsed.searchParams.get('listId')?.trim();
    return listId || null;
  } catch {
    return null;
  }
}

export async function handlePushReactUrl(url: string): Promise<boolean> {
  const listId = parsePushReactUrl(url);
  if (!listId) return false;

  const now = Date.now();
  const key = `react:${listId}`;
  if (lastHandledPushReactKey === key && now - lastHandledPushReactAt < 4000) {
    return true;
  }
  lastHandledPushReactKey = key;
  lastHandledPushReactAt = now;

  await reactToListFromPush(listId);
  return true;
}

export function startPushResponseListener(): () => void {
  if (responseListener) {
    return () => {
      responseListener?.remove();
      responseListener = null;
    };
  }

  responseListener = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );

  return () => {
    responseListener?.remove();
    responseListener = null;
  };
}

/** Handle iOS in-card React via `localnotes://push-react?listId=...`. */
export function startPushReactLinkingListener(): () => void {
  if (linkingSubscription) {
    return () => {
      linkingSubscription?.remove();
      linkingSubscription = null;
    };
  }

  const onUrl = (event: { url: string }) => {
    void handlePushReactUrl(event.url);
  };

  linkingSubscription = Linking.addEventListener('url', onUrl);

  void Linking.getInitialURL().then((url) => {
    if (url) {
      void handlePushReactUrl(url);
    }
  });

  return () => {
    linkingSubscription?.remove();
    linkingSubscription = null;
  };
}

/** Handle a cold-start notification tap once (call from authenticated shell). */
export async function consumeInitialNotificationResponse(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    handleNotificationResponse(response);
  }
}
