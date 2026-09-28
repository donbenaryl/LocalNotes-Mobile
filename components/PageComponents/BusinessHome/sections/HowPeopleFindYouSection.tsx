import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type {
  BusinessHomeDiscovery,
  BusinessHomeDiscoveryChannelKey,
} from '@/hooks/useBusinessHomeData';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { Modal } from '@/components/ui/Modal';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { KeyValueRow } from '../ui/KeyValueRow';
import { SectionHeading } from '../ui/SectionHeading';

interface HowPeopleFindYouSectionProps {
  periodLabel: string;
  discovery: BusinessHomeDiscovery;
  onOpenSpotlight: () => void;
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

const REACH_MORE_ACTION_LABEL: Record<BusinessHomeDiscoveryChannelKey, string> = {
  search: 'businessHome.discovery.reachMore.actionSearch',
  discover: 'businessHome.discovery.reachMore.actionDiscover',
  lists: 'businessHome.discovery.reachMore.actionOffer',
  picks: 'businessHome.discovery.reachMore.actionOffer',
};

export function HowPeopleFindYouSection({
  periodLabel,
  discovery,
  onOpenSpotlight,
}: HowPeopleFindYouSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();
  const [expanded, setExpanded] = useState(false);
  const [reachMoreOpen, setReachMoreOpen] = useState(false);

  const leading = discovery.leading;

  const handleReachMoreAction = () => {
    if (!leading) return;
    setReachMoreOpen(false);
    switch (leading.key) {
      case 'search':
        router.push('/edit-profile');
        break;
      case 'discover':
        onOpenSpotlight();
        break;
      case 'lists':
      case 'picks':
        void openCreateOfferOnWeb();
        break;
    }
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
              {leading
                ? t('businessHome.discovery.insight', {
                    channel: t(`businessHome.discovery.${leading.key}`),
                  })
                : t('businessHome.discovery.insightEmpty')}
            </Text>
            {leading ? (
              <LocalNotesButton
                label={t('businessHome.buttons.reachMore')}
                onPress={() => setReachMoreOpen(true)}
                variant="brand"
                size="xs"
                isWidthFull={false}
                className="mt-4 self-end"
              />
            ) : null}
          </>
        ) : null}
      </BusinessHomeCard>

      {leading ? (
        <Modal
          visible={reachMoreOpen}
          onClose={() => setReachMoreOpen(false)}
          title={t('businessHome.discovery.reachMore.title', {
            channel: t(`businessHome.discovery.${leading.key}`),
          })}
        >
          <Text className="font-geist text-sm leading-[1.55] text-gray-600 dark:text-gray-400">
            {t(`businessHome.discovery.reachMore.${leading.key}`)}
          </Text>
          <View className="mt-5 gap-2">
            <LocalNotesButton
              label={t(REACH_MORE_ACTION_LABEL[leading.key])}
              onPress={handleReachMoreAction}
              variant="brand"
              size="sm"
            />
            <LocalNotesButton
              label={t('businessHome.discovery.reachMore.cancel')}
              onPress={() => setReachMoreOpen(false)}
              variant="light"
              size="sm"
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}
