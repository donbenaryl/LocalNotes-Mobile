import { useMemo } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { useBusinessTypes } from '@/hooks/useBusinessTypes';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { gradeBusinessProfile, type ProfileHealthGap } from '@/utils/profileHealth';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { MembershipGate } from '../ui/MembershipGate';
import { Badge } from '@/components/ui/Badge';

export function RunAnotherCampaignSection({ isPaidMember }: { isPaidMember: boolean }) {
  const { t } = useTranslation();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="free">
      <BusinessHomeCard className="mt-2">
        <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
          {t('businessHome.runAnother.title')}
        </Text>
        <Text className="mt-1 font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
          {t('businessHome.runAnother.body')}
        </Text>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5 self-end">
          <LocalNotesButton
            label={t('businessHome.buttons.createOffer')}
            onPress={() => void openCreateOfferOnWeb()}
            variant="brand"
            size="xs"
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.buttons.submitSpotlight')}
            onPress={showComingSoon}
            variant="light"
            size="xs"
            isWidthFull={false}
          />
        </View>
      </BusinessHomeCard>
    </MembershipGate>
  );
}

const MAX_LISTED_DETAILS = 2;

function describeGap(
  gap: ProfileHealthGap,
  businessType: string,
  t: TFunction,
): string | null {
  if (gap.group !== 'importantInfo') {
    return t(`businessHome.profileHealth.gap.${gap.group}`);
  }
  const missing = gap.missing ?? [];
  if (missing.length === 0) return null;
  if (missing.length > MAX_LISTED_DETAILS) {
    return t('businessHome.profileHealth.gap.importantInfoMany', {
      count: missing.length,
      type: businessType.toLowerCase(),
    });
  }
  return t('businessHome.profileHealth.gap.importantInfo', {
    items: missing.map((label) => label.toLowerCase()).join(', '),
  });
}

export function ProfileHealthSection({ isPaidMember }: { isPaidMember: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const businessInfo = useBusinessStore((s) => s.businessInfo);
  const selectedBranchId = useBusinessStore((s) => s.selectedBranchId);
  const { data: businessTypes = [] } = useBusinessTypes();

  const health = useMemo(() => {
    const branch =
      businessInfo?.branches?.find((item) => item.id === selectedBranchId) ??
      businessInfo?.branches?.[0];
    return gradeBusinessProfile(businessInfo, branch, businessTypes);
  }, [businessInfo, selectedBranchId, businessTypes]);

  const gapLabels = health.gaps
    .map((gap) => describeGap(gap, businessInfo?.business_type ?? '', t))
    .filter((label): label is string => Boolean(label));

  if (!businessInfo) return null;

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="free">
      <BusinessHomeCard className="mt-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-geist-extrabold text-md text-ink dark:text-gray-100">
            {t('businessHome.profileHealth.title', { score: health.score })}
          </Text>
          <Badge
            label={t('businessHome.profileHealth.freeBadge')}
            variant="success"
            size="md"
          />
        </View>
        <Text className="mt-1 font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
          {gapLabels.length > 0
            ? t('businessHome.profileHealth.gaps', {
                count: gapLabels.length,
                list: gapLabels.join(' · '),
              })
            : t('businessHome.profileHealth.complete')}
        </Text>
        {gapLabels.length > 0 ? (
          <LocalNotesButton
            label={t('businessHome.buttons.fixNow')}
            onPress={() => router.push('/edit-profile')}
            size="xs"
            isWidthFull={false}
            className="mt-2.5 self-end"
          />
        ) : null}
      </BusinessHomeCard>
    </MembershipGate>
  );
}
