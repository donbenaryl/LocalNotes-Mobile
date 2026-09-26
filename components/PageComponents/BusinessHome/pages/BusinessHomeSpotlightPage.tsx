import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { TextInput } from '@/components/ui/TextInput';
import { SectionHeading } from '../ui/SectionHeading';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';

interface BusinessHomeSpotlightPageProps {
  onBack: () => void;
}

export function BusinessHomeSpotlightPage({
  onBack,
}: BusinessHomeSpotlightPageProps) {
  const { t } = useTranslation();
  const [bid, setBid] = useState('');

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.spotlight')}
      onBack={onBack}
    >
      <View className="mt-2 px-4">
        <View className="mb-3 self-start rounded-full bg-brand-tint px-2.5 py-1">
          <Text className="font-geist-bold text-[11px] text-brand">
            {t('businessHome.spotlightPage.status')}
          </Text>
        </View>
        <Text className="font-geist-extrabold text-lg text-ink dark:text-gray-100">
          {t('businessHome.spotlightPage.title')}
        </Text>
        <Text className="mt-2 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
          {t('businessHome.spotlightPage.body')}
        </Text>
      </View>

      <BusinessHomeCard className="mt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-geist-semibold text-xs text-gray-500 dark:text-gray-400">
            {t('businessHome.spotlightPage.highestBid')}
          </Text>
          <Text className="font-geist-extrabold text-base text-ink dark:text-gray-100">
            {t('businessHome.spotlightPage.highestBidValue')}
          </Text>
        </View>
      </BusinessHomeCard>

      <SectionHeading title={t('businessHome.spotlightPage.yourBid')} />
      <View className="px-4">
        <TextInput
          value={bid}
          onChangeText={setBid}
          placeholder={t('businessHome.spotlightPage.bidPlaceholder')}
          keyboardType="numeric"
        />
      </View>

      <View className="mt-3 px-4">
        <LocalNotesButton
          label={t('businessHome.spotlightPage.placeBid')}
          onPress={showComingSoon}
          variant="brand"
          size="sm"
        />
      </View>
    </BusinessHomeDetailShell>
  );
}
