import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BUSINESS_HOME_PROFILE_HEALTH } from '@/constants/businessHomeMock';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
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

export function ProfileHealthSection({ isPaidMember }: { isPaidMember: boolean }) {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="free">
      <BusinessHomeCard className="mt-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-geist-extrabold text-md text-ink dark:text-gray-100">
            {t('businessHome.profileHealth.title', {
              score: BUSINESS_HOME_PROFILE_HEALTH.score,
            })}
          </Text>
          <Badge
            label={t('businessHome.profileHealth.freeBadge')}
            variant="success"
            size="md"
          />
        </View>
        <Text className="mt-1 font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
          {BUSINESS_HOME_PROFILE_HEALTH.gaps}
        </Text>
        <LocalNotesButton
          label={t('businessHome.buttons.fixNow')}
          onPress={showComingSoon}
          size="xs"
          isWidthFull={false}
          className="mt-2.5 self-end"
        />
      </BusinessHomeCard>
    </MembershipGate>
  );
}
