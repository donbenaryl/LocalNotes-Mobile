import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BUSINESS_HOME_ALERT } from '@/constants/businessHomeMock';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { KeyValueRow } from '../ui/KeyValueRow';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';

interface AlertsSectionProps {
  isPaidMember: boolean;
}

export function AlertsSection({ isPaidMember }: AlertsSectionProps) {
  const { t } = useTranslation();
  const openBusinessInsightsOnWeb = useOpenBusinessInsightsOnWeb();
  const [showHours, setShowHours] = useState(false);

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <>
      <MembershipGate isPaidMember={isPaidMember} tier="paid">
        <SectionHeading title={t('businessHome.sections.alerts')} />
        <BusinessHomeCard>
          <View className="flex-row gap-2">
            <View className="mt-1 h-2 w-2 rounded-full bg-brand" />
            <View className="flex-1">
              <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
                {BUSINESS_HOME_ALERT.title}
              </Text>
              <Text className="mt-1 font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
                {BUSINESS_HOME_ALERT.body}
              </Text>
              <View className="mt-2.5 flex-row flex-wrap gap-1.5">
                <LocalNotesButton
                  label={t('businessHome.buttons.confirmHours')}
                  onPress={() => setShowHours(true)}
                  variant="dark"
                  size="sm"
                  isWidthFull={false}
                />
                <LocalNotesButton
                  label={t('businessHome.buttons.assignToSarah')}
                  onPress={showComingSoon}
                  variant="light"
                  size="sm"
                  isWidthFull={false}
                />
                <LocalNotesButton
                  label={t('businessHome.buttons.dismiss')}
                  onPress={showComingSoon}
                  variant="ghost"
                  size="sm"
                  isWidthFull={false}
                />
              </View>
              {showHours ? (
                <View className="mt-2 rounded-xl bg-soft px-3 py-2.5 dark:bg-gray-900">
                  <KeyValueRow
                    label={t('businessHome.alert.saturday')}
                    value={BUSINESS_HOME_ALERT.saturdayHours}
                  />
                  <KeyValueRow
                    label={t('businessHome.alert.sunday')}
                    value={BUSINESS_HOME_ALERT.sundayHours}
                  />
                  <View className="mt-2 flex-row flex-wrap gap-1.5">
                    <LocalNotesButton
                      label={t('businessHome.buttons.confirm')}
                      onPress={showComingSoon}
                      variant="dark"
                      size="xs"
                      isWidthFull={false}
                    />
                    <LocalNotesButton
                      label={t('businessHome.buttons.changeHours')}
                      onPress={showComingSoon}
                      variant="ghost"
                      size="xs"
                      isWidthFull={false}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </BusinessHomeCard>
      </MembershipGate>

      <MembershipGate isPaidMember={isPaidMember} tier="free">
        <SectionHeading title={t('businessHome.sections.alerts')} />
        <BusinessHomeCard variant="upsell">
          <Text className="font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
            {t('businessHome.alert.membersOnlyTitle')}
          </Text>
          <Text className="mt-1 font-geist text-xs leading-[1.5] text-gray-600 dark:text-gray-400">
            {t('businessHome.alert.membersOnlyBody')}
          </Text>
          <LocalNotesButton
            label={t('businessHome.upsell.continueOnWeb')}
            onPress={() => void openBusinessInsightsOnWeb()}
            variant="brand"
            size="sm"
            className="mt-3 justify-center"
          />
        </BusinessHomeCard>
      </MembershipGate>
    </>
  );
}
