import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBusinessAccountType } from '@/utils/businessAccount';

export default function ClaimBusinessLayout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const accountType = useAuthStore((s) => s.accountType ?? s.user?.accountType);
  const isBusiness = isBusinessAccountType(accountType ?? undefined);

  useEffect(() => {
    if (!isBusiness) {
      router.replace('/profile' as never);
    }
  }, [isBusiness, router]);

  if (!isBusiness) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#111827' : '#fafaf7',
        },
      }}
    />
  );
}
