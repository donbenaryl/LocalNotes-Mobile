import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { OfferDetailsMain } from '@/components/PageComponents/Offers/OfferDetailsMain';
import { useActiveBusinessOffers } from '@/hooks/useActiveBusinessOffers';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { mapNoteDaoToOfferItem } from '@/types/offer';
import { ActiveOfferCard } from '../ui/ActiveOfferCard';

/** The business's active offers; tapping one opens its details sheet. */
export function ActiveOffersList() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const businessId = useBusinessStore((s) => s.businessId);
  const { offers, isLoading, error, refetch } = useActiveBusinessOffers(
    businessId || undefined,
  );
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const spinnerColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  let content;
  if (isLoading) {
    content = (
      <View className="items-center py-4">
        <ActivityIndicator color={spinnerColor} />
      </View>
    );
  } else if (error) {
    content = (
      <View className="items-start px-5 pb-2">
        <Text className="font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
          {t('businessHome.campaignsTab.loadError')}
        </Text>
        <Pressable
          onPress={() => void refetch()}
          accessibilityRole="button"
          className="mt-1 active:opacity-70"
        >
          <Text className="font-geist-semibold text-xs text-brand">
            {t('common.retry')}
          </Text>
        </Pressable>
      </View>
    );
  } else if (offers.length === 0) {
    content = (
      <Text className="px-5 pb-2 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
        {t('businessHome.campaignsTab.activeEmpty')}
      </Text>
    );
  } else {
    content = (
      <View className="gap-3 pb-3">
        {offers.map((offer) => (
          <ActiveOfferCard
            key={offer.id}
            offer={mapNoteDaoToOfferItem(offer)}
            onPress={() => setSelectedOfferId(offer.id)}
          />
        ))}
      </View>
    );
  }

  return (
    <>
      {content}
      <OfferDetailsMain
        noteId={selectedOfferId ?? undefined}
        visible={selectedOfferId != null}
        onClose={() => {
          setSelectedOfferId(null);
          void refetch();
        }}
        viewOrigin="profile"
      />
    </>
  );
}
