import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';
import { CopilotChatBody } from './CopilotChatBody';

/**
 * Copilot route body. Guards (business account, selected branch paid) live here; the chat itself
 * mounts only for a paid branch and is keyed by branch, so branches never share a conversation.
 */
export default function BusinessCopilotPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ threadId?: string; q?: string }>();
  const accountType = useAuthStore((s) => s.accountType ?? s.user?.accountType);
  const { branchId, branchName, isPaid } = useSelectedBranch();
  const openUpgrade = useOpenBusinessInsightsOnWeb();
  const isBusiness = isBusinessAccountType(accountType ?? undefined);

  // Route params describe the branch the screen was opened for; after a switch they no longer apply.
  const openedForBranch = useRef(branchId);

  useEffect(() => {
    if (!isBusiness) router.replace('/profile' as never);
  }, [isBusiness, router]);

  if (!isBusiness) return null;

  if (!isPaid) {
    return (
      <BusinessHomeDetailShell title={t('businessHome.copilot.title')} onBack={() => router.back()}>
        <View className="mt-4">
          <BusinessHomeCard variant="upsell">
            <Text className="font-geist-extrabold text-base text-ink dark:text-gray-100">
              {t('businessHome.copilot.notEntitledBranch', { branchName })}
            </Text>
            <Text className="mt-2 font-geist text-[13px] leading-[1.55] text-gray-600 dark:text-gray-400">
              {t('businessHome.copilot.notEntitledBody')}
            </Text>
            <View className="mt-3">
              <LocalNotesButton
                label={t('businessHome.copilot.upgradeCta')}
                onPress={() => void openUpgrade()}
                variant="dark"
                size="sm"
              />
            </View>
          </BusinessHomeCard>
        </View>
      </BusinessHomeDetailShell>
    );
  }

  const sameBranch = openedForBranch.current === branchId;
  return (
    <CopilotChatBody
      key={branchId ?? 'none'}
      initialThreadId={sameBranch ? params.threadId : undefined}
      initialQuestion={sameBranch ? params.q : undefined}
      onBack={() => router.back()}
    />
  );
}
