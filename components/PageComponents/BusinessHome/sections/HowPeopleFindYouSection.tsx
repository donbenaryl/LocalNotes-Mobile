import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BUSINESS_HOME_DISCOVERY } from '@/constants/businessHomeMock';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { KeyValueRow } from '../ui/KeyValueRow';
import { SectionHeading } from '../ui/SectionHeading';

export function HowPeopleFindYouSection() {
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
      <BusinessHomeCard>
        <KeyValueRow label={t('businessHome.discovery.search')} value={BUSINESS_HOME_DISCOVERY.search} />
        <KeyValueRow label={t('businessHome.discovery.lists')} value={BUSINESS_HOME_DISCOVERY.lists} />
        <KeyValueRow label={t('businessHome.discovery.picks')} value={BUSINESS_HOME_DISCOVERY.picks} />
        <KeyValueRow label={t('businessHome.discovery.discover')} value={BUSINESS_HOME_DISCOVERY.discover} />
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
              isRounded
              isWidthFull={false}
              className="mt-2 self-start"
            />
          </>
        ) : null}
      </BusinessHomeCard>
    </>
  );
}
