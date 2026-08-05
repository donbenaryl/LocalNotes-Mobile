import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import {
  PUSH_ACTION_DISMISS,
  PUSH_ACTION_REACT,
  PUSH_CATEGORY_DEFAULT,
  PUSH_CATEGORY_LIST_ACTIVITY,
} from '@/constants/pushNotifications';
import { parseRichPushData, type RichPushData } from '@/types/pushNotification';

let categoriesRegistered = false;
let responseListener: Notifications.EventSubscription | null = null;

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
 * - LIST_ACTIVITY category actions (Dismiss / React)
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

  await Notifications.setNotificationCategoryAsync(PUSH_CATEGORY_LIST_ACTIVITY, [
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
  ]);

  // Explicit default category with no actions (some Android OEMs require registration).
  await Notifications.setNotificationCategoryAsync(PUSH_CATEGORY_DEFAULT, []);

  categoriesRegistered = true;
}

function resolveDeepLink(data: RichPushData): Href | null {
  const link = data.deepLink?.trim();
  if (!link) return null;

  if (link.startsWith('/lists/')) {
    const listId = link.replace('/lists/', '').split('/')[0];
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

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const actionId = response.actionIdentifier;
  const data = parseRichPushData(response.notification.request.content.data);

  if (actionId === PUSH_ACTION_DISMISS) {
    // System dismisses the notification; no navigation.
    return;
  }

  // Default tap or React → open the related list / deep link.
  navigateFromPushData(data);
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

/** Handle a cold-start notification tap once (call from authenticated shell). */
export async function consumeInitialNotificationResponse(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    handleNotificationResponse(response);
  }
}
