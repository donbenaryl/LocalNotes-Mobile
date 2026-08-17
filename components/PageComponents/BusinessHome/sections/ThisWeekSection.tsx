import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_HOME_ACTIVITY_ROWS,
  BUSINESS_HOME_BRIEF,
} from '@/constants/businessHomeMock';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';

interface ThisWeekSectionProps {
  isPaidMember: boolean;
}

export function ThisWeekSection({ isPaidMember }: ThisWeekSectionProps) {
  const { t } = useTranslation();
  const [showAssign, setShowAssign] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <SectionHeading title={t('businessHome.sections.thisWeek')} />
      <BusinessHomeCard variant="brief">
        <View className="flex-row items-center gap-2">
          <View className="h-[22px] w-[22px] items-center justify-center rounded-md bg-brand">
            <Sparkles size={12} color="#fff" />
          </View>
          <Text className="font-geist-extrabold text-[10.5px] uppercase tracking-widest text-brand-dark">
            {t('businessHome.brief.kicker', { period: BUSINESS_HOME_BRIEF.periodLabel })}
          </Text>
        </View>
        <Text className="mt-2 font-geist text-[13.5px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t('businessHome.brief.body')}
        </Text>
        <Text className="mt-2 font-geist-bold text-[13.5px] leading-snug text-ink dark:text-gray-100">
          <Text className="text-brand-dark">{t('businessHome.brief.nextLabel')}</Text>{' '}
          {t('businessHome.brief.nextMove')}
        </Text>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          <LocalNotesButton
            label={t('businessHome.buttons.createOffer')}
            onPress={showComingSoon}
            variant="brand"
            size="sm"
            isRounded
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.buttons.supportingData')}
            onPress={showComingSoon}
            variant="light"
            size="sm"
            isRounded
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.buttons.assign')}
            onPress={() => setShowAssign((v) => !v)}
            variant="ghost"
            size="sm"
            isRounded
            isWidthFull={false}
          />
        </View>
        {showAssign ? (
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
              {t('businessHome.brief.assignRow')}
            </Text>
            <LocalNotesButton
              label={t('businessHome.buttons.assign')}
              onPress={() => setAssigned(true)}
              variant="dark"
              size="xs"
              isRounded
              isWidthFull={false}
            />
          </View>
        ) : null}
        {assigned ? (
          <Text className="mt-2 font-geist-bold text-xs text-success">
            {t('businessHome.brief.assignedOk')}
          </Text>
        ) : null}
      </BusinessHomeCard>

      <BusinessHomeCard className="mt-2">
        {BUSINESS_HOME_ACTIVITY_ROWS.map((row, index) => (
          <View
            key={row.title}
            className={`flex-row items-center gap-2.5 py-2 ${
              index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <Text className="flex-1 font-geist-bold text-[13px] text-ink dark:text-gray-100">
              {row.title}
            </Text>
            <Text
              className={`font-geist-semibold text-xs ${
                row.highlight ? 'text-brand' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {row.meta}
            </Text>
          </View>
        ))}
      </BusinessHomeCard>
    </MembershipGate>
  );
}
