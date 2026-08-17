import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BusinessHomeLocationRow } from '@/constants/businessHomeMock';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';

interface LocationsSectionProps {
  locationRows: BusinessHomeLocationRow[];
  isPaidMember: boolean;
}

export function LocationsSection({ locationRows, isPaidMember }: LocationsSectionProps) {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <>
      <SectionHeading title={t('businessHome.sections.locations')} />
      <BusinessHomeCard>
        {locationRows.map((row, index) => (
          <Pressable
            key={row.name}
            onPress={showComingSoon}
            accessibilityRole="button"
            className={`flex-row items-center justify-between py-2 ${
              index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <Text className="flex-1 font-geist-semibold text-[13px] text-gray-600 dark:text-gray-400">
              📍 {row.name}
              {row.isViewing ? ` · ${t('businessHome.locations.viewing')}` : ''}
            </Text>
            <Text
              className={`font-geist-bold text-[13px] ${
                row.highlight === 'green'
                  ? 'text-success'
                  : row.highlight === 'warn'
                    ? 'text-brand-dark'
                    : 'text-ink dark:text-gray-100'
              }`}
            >
              {row.savesLabel}
            </Text>
          </Pressable>
        ))}
        <Text className="mt-1 font-geist-semibold text-[11px] leading-[1.5] text-gray-500">
          {t('businessHome.locations.note')}
        </Text>
        <MembershipGate isPaidMember={isPaidMember} tier="paid">
          <Text className="mt-1 font-geist-semibold text-[11px] leading-[1.5] text-gray-500">
            {t('businessHome.locations.paidNote')}
          </Text>
        </MembershipGate>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          <LocalNotesButton
            label={t('businessHome.buttons.compareLocations')}
            onPress={showComingSoon}
            variant="light"
            size="sm"
            isRounded
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.buttons.addLocation')}
            onPress={showComingSoon}
            variant="ghost"
            size="sm"
            isRounded
            isWidthFull={false}
          />
        </View>
      </BusinessHomeCard>
    </>
  );
}
