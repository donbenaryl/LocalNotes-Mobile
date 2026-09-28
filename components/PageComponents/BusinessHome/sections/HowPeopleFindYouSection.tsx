import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BusinessHomeDiscovery } from '@/hooks/useBusinessHomeData';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { KeyValueRow } from '../ui/KeyValueRow';
import { SectionHeading } from '../ui/SectionHeading';

interface HowPeopleFindYouSectionProps {
  periodLabel: string;
  discovery: BusinessHomeDiscovery;
}

function DiscoveryProgressRow({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <View className="py-2">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-geist-bold text-[13px] text-ink dark:text-gray-100">
          {label}
        </Text>
        <Text className="font-geist-bold text-[13px] text-brand">{`${percent}%`}</Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <View
          className="h-full rounded-full bg-brand"
          style={{ width: `${width}%` }}
        />
      </View>
    </View>
  );
}

export function HowPeopleFindYouSection({
  periodLabel,
  discovery,
}: HowPeopleFindYouSectionProps) {
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
        {discovery.channels.map((channel) => (
          <DiscoveryProgressRow
            key={channel.key}
            label={t(`businessHome.discovery.${channel.key}`)}
            percent={channel.percent}
          />
        ))}
        <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
          <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
            {t('businessHome.discovery.seeDetails')}
          </Text>
        </Pressable>
        {expanded ? (
          <>
            {discovery.channels.map((channel) => (
              <KeyValueRow
                key={channel.key}
                label={t(`businessHome.discovery.${channel.key}`)}
                value={t('businessHome.discovery.viewsCount', {
                  value: formatCompactNumber(channel.count),
                })}
              />
            ))}
            <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
              {discovery.leading
                ? t('businessHome.discovery.insight', {
                    channel: t(`businessHome.discovery.${discovery.leading.key}`),
                  })
                : t('businessHome.discovery.insightEmpty')}
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
