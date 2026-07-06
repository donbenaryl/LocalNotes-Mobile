import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuthStore } from '../../stores/useAuthStore';
import { hydrateUserProfile } from '../../services/authBootstrap';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
