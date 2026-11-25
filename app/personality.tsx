import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PageLoader } from '@/components/ui/PageLoader';
import { OnboardingFlow } from '@/components/PageComponents/Onboarding/OnboardingFlow';
import { Personality } from '../components/PageComponents/Personality.tsx';
import { hydrateUserProfile } from '../services/authBootstrap';
import { useAuthStore } from '../stores/useAuthStore';

export default function PersonalityScreen() {
  const router = useRouter();
  const { isRetake } = useLocalSearchParams<{
    isRetake?: string;
    fromOnboarding?: string;
  }>();
  const isRetakeMode = isRetake === 'true';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [isHydrating, setIsHydrating] = useState(isAuthenticated && !user);

  useEffect(() => {
    if (!isAuthenticated || user) {
      setIsHydrating(false);
      return;
    }

    let cancelled = false;

    async function hydrate() {
      const hydrated = await hydrateUserProfile();
      if (!hydrated) {
        await useAuthStore.getState().clearAuth();
      }
      if (!cancelled) {
        setIsHydrating(false);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  if (isHydrating) {
    return <PageLoader />;
  }

  // Full onboarding (personality → home base → starters) under one persistent header.
  // Retake keeps the standalone quiz UI without the stepper shell.
  if (!isRetakeMode) {
    return (
      <OnboardingFlow
        onComplete={() => {
          router.replace('/home' as Href);
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-page dark:bg-dk-page">
      <Personality
        hideBack={false}
        onComplete={() => {
          router.back();
        }}
      />
    </View>
  );
}
