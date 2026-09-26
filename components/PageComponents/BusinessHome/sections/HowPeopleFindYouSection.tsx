import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BUSINESS_HOME_DISCOVERY } from '@/constants/businessHomeMock';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { KeyValueRow } from '../ui/KeyValueRow';
import { SectionHeading } from '../ui/SectionHeading';

interface HowPeopleFindYouSectionProps {
  periodLabel: string;
}

type DiscoveryChannel = {
  labelKey: 'search' | 'lists' | 'picks' | 'discover';
  value: string;
};

const CHANNELS: DiscoveryChannel[] = [
  { labelKey: 'search', value: BUSINESS_HOME_DISCOVERY.search },
  { labelKey: 'lists', value: BUSINESS_HOME_DISCOVERY.lists },
  { labelKey: 'picks', value: BUSINESS_HOME_DISCOVERY.picks },
  { labelKey: 'discover', value: BUSINESS_HOME_DISCOVERY.discover },
];

function parsePercent(value: string): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function DiscoveryProgressRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const percent = parsePercent(value);

  return (
    <View className="py-2">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-geist-bold text-[13px] text-ink dark:text-gray-100">
          {label}
        </Text>
        <Text className="font-geist-bold text-[13px] text-brand">{value}</Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <View
          className="h-full rounded-full bg-brand"
          style={{ width: `${percent}%` }}
        />
      </View>
    </View>
  );
}

export function HowPeopleFindYouSection({ periodLabel }: HowPeopleFindYouSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <>
      <SectionHeading title={t('businessHome.sections.howPeopleFindYou')} />
      <Text className="mx-4 mb-2 font-geist-semibold text-[12px] text-gray-500 dark:text-gray-400">
        {periodLabel}
      </Text>
      <BusinessHomeCard>
        {CHANNELS.map((channel) => (
          <DiscoveryProgressRow
            key={channel.labelKey}
            label={t(`businessHome.discovery.${channel.labelKey}`)}
            value={channel.value}
          />
        ))}
        <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
          <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
            {t('businessHome.discovery.seeDetails')}
          </Text>
        </Pressable>
        {expanded ? (
          <>
            {BUSINESS_HOME_DISCOVERY.details.map((item) => (
              <KeyValueRow key={item.label} label={item.label} value={item.value} />
            ))}
            <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
              {BUSINESS_HOME_DISCOVERY.insight}
            </Text>
            <LocalNotesButton
              label={t('businessHome.buttons.reachMore')}
              onPress={showComingSoon}
              variant="brand"
              size="xs"
              isWidthFull={false}
              className="mt-4 self-end"
            />
          </>
        ) : null}
      </BusinessHomeCard>
    </>
  );
}
