import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import accountService from '@/http/account-api/account.services';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  ensurePushCategoriesRegistered,
  startPushResponseListener,
  startPushReactLinkingListener,
  consumeInitialNotificationResponse,
} from '@/services/pushNotifications';

type PushRegistrationStatus = 'idle' | 'registering' | 'registered' | 'denied' | 'error';

interface UsePushNotificationsResult {
  status: PushRegistrationStatus;
  expoPushToken: string | null;
  error: string | null;
}

/**
 * Requests notification permission and registers the device's Expo push token with the
 * backend (`POST /accounts/notification-token`). Also registers LIST_ACTIVITY / DEFAULT
 * categories, listens for Dismiss / React / tap responses, and handles iOS
 * `localnotes://push-react` deep links from the notification content extension.
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [status, setStatus] = useState<PushRegistrationStatus>('idle');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAttempted = useRef(false);

  useEffect(() => {
    const stopResponse = startPushResponseListener();
    const stopLinking = startPushReactLinkingListener();
    void consumeInitialNotificationResponse();
    return () => {
      stopResponse();
      stopLinking();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || hasAttempted.current) return;
    hasAttempted.current = true;

    let cancelled = false;

    async function registerForPushNotifications() {
      setStatus('registering');
      setError(null);

      try {
        await ensurePushCategoriesRegistered();

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'LocalNotes',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B2C',
            showBadge: true,
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
