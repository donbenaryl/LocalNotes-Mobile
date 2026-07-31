import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { FaceIcon } from '@/components/ui/icons/FaceIcon';
import { authenticateWithBiometrics } from '@/services/biometricAuth';
import { hydrateUserProfile } from '@/services/authBootstrap';
import { useAuthStore } from '@/stores/useAuthStore';
import { getPostAuthRoute } from '@/utils/personality';
import { toast } from '@/components/ui/Toast';

export function FaceSignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const unlockSession = useAuthStore((s) => s.unlockSession);
  const [pending, setPending] = useState(false);

  async function handleUnlock() {
    if (pending) return;
    setPending(true);
    try {
      const ok = await authenticateWithBiometrics(t('faceSignIn.prompt'));
      if (!ok) {
        toast.error(t('faceSignIn.failed'), { title: t('alerts.error') });
        return;
      }

      unlockSession();
      const hydrated = await hydrateUserProfile();
      if (!hydrated) {
        await useAuthStore.getState().clearAuth();
        toast.error(t('faceSignIn.sessionExpired'), {
          title: t('alerts.signInFailed'),
        });
        return;
      }

      const personalityName = useAuthStore.getState().user?.personalityName;
      router.replace(getPostAuthRoute(personalityName) as Href);
    } finally {
      setPending(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={() => void handleUnlock()}
      disabled={pending}
      className="items-center gap-4 cursor-pointer"
    >
      {pending ? (
        <ActivityIndicator
          color={colorScheme === 'dark' ? '#F5F5F5' : '#191B1C'}
        />
      ) : (
        <FaceIcon width={50} height={50} />
      )}
      <Text className="text-gray-500 dark:text-gray-400 font-geist text-lg">
        {pending ? t('faceSignIn.unlocking') : t('faceSignIn.label')}
      </Text>
    </TouchableOpacity>
  );
}
