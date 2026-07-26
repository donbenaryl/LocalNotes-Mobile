import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import accountService from '@/http/account-api/account.services';
import { useAuthStore } from '@/stores/useAuthStore';

type PushRegistrationStatus = 'idle' | 'registering' | 'registered' | 'denied' | 'error';

interface UsePushNotificationsResult {
  status: PushRegistrationStatus;
  expoPushToken: string | null;
  error: string | null;
}

/**
 * Requests notification permission and registers the device's Expo push token with the
 * backend (`POST /accounts/notification-token`, which writes to the same
 * `Account.device_notification_tokens` field `send_push_notification_w_celery` reads from —
 * see backend plan.md §1.10). Mounted once in the authenticated app shell
 * (`app/(app)/_layout.tsx`) so it re-registers on every cold start / foreground, covering
 * token rotation without needing a dedicated re-registration trigger.
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [status, setStatus] = useState<PushRegistrationStatus>('idle');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasAttempted.current) return;
    hasAttempted.current = true;

    let cancelled = false;

    async function registerForPushNotifications() {
      setStatus('registering');
      setError(null);

      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
          finalStatus = requestedStatus;
        }

        if (finalStatus !== 'granted') {
          if (!cancelled) setStatus('denied');
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled) return;

        await accountService.registerNotificationToken({ token });
        if (cancelled) return;

        setExpoPushToken(token);
        setStatus('registered');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to register for push notifications');
          setStatus('error');
        }
      }
    }

    void registerForPushNotifications();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return { status, expoPushToken, error };
}
