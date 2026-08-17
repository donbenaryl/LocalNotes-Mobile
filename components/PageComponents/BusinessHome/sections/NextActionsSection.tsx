import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_HOME_ACTION_PLAN,
  BUSINESS_HOME_ACTIVE_PLAN,
} from '@/constants/businessHomeMock';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';

interface NextActionsSectionProps {
  isPaidMember: boolean;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

export function NextActionsSection({
  isPaidMember,
  onOpenSheet,
}: NextActionsSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <SectionHeading title={t('businessHome.sections.nextActions')} />
      <BusinessHomeCard className="flex-row items-center gap-3">
        <Text className="text-base">⚑</Text>
        <View className="min-w-0 flex-1">
          <Text className="font-geist-extrabold text-[13.5px] text-ink dark:text-gray-100">
            {BUSINESS_HOME_ACTIVE_PLAN.title}
          </Text>
          <Text className="mt-0.5 font-geist text-xs text-gray-600 dark:text-gray-400">
            {BUSINESS_HOME_ACTIVE_PLAN.subtitle}
          </Text>
        </View>
        <LocalNotesButton
          label={t('businessHome.buttons.viewPlan')}
          onPress={() => onOpenSheet('plans')}
          variant="light"
          size="xs"
          isRounded
          isWidthFull={false}
        />
      </BusinessHomeCard>

      <BusinessHomeCard className="mt-2 overflow-hidden p-0">
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          className="px-4 py-3"
        >
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
              {BUSINESS_HOME_ACTION_PLAN.title}
            </Text>
            <ChevronDown
              size={15}
              color="#78716C"
              style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
            />
          </View>
          <Text className="mt-1 font-geist text-[12.5px] text-gray-600 dark:text-gray-400">
            {BUSINESS_HOME_ACTION_PLAN.summary}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-2.5">
            <Text className="font-geist-bold text-[11px] text-gray-600 dark:text-gray-400">
              {t('businessHome.action.priority')}{' '}
              <Text className="text-ink dark:text-gray-100">
                {BUSINESS_HOME_ACTION_PLAN.priority}
              </Text>
            </Text>
            <Text className="font-geist-bold text-[11px] text-gray-600 dark:text-gray-400">
              {t('businessHome.action.effort')}{' '}
              <Text className="text-ink dark:text-gray-100">
                {BUSINESS_HOME_ACTION_PLAN.effort}
              </Text>
            </Text>
            <Text className="font-geist-bold text-[11px] text-gray-600 dark:text-gray-400">
              {t('businessHome.action.confidence')}{' '}
              <Text className="text-ink dark:text-gray-100">
                {BUSINESS_HOME_ACTION_PLAN.confidence}
              </Text>
            </Text>
            <LocalNotesButton
              label={t('businessHome.buttons.startActionPlan')}
              onPress={showComingSoon}
              variant="dark"
              size="xs"
              isRounded
              isWidthFull={false}
            />
          </View>
        </Pressable>
        {expanded ? (
          <View className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <Text className="font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
              {BUSINESS_HOME_ACTION_PLAN.evidence}
            </Text>
            <Text className="mt-1.5 font-geist-semibold text-[11px] text-gray-500">
              {BUSINESS_HOME_ACTION_PLAN.source}
            </Text>
            <Text className="mt-2 font-geist-extrabold text-[10.5px] uppercase tracking-wide text-brand-dark">
              {t('businessHome.action.recommendedStep')}
            </Text>
            <Text className="mt-0.5 font-geist-semibold text-[12.5px] text-ink dark:text-gray-100">
              {BUSINESS_HOME_ACTION_PLAN.recommendedStep}
            </Text>
            <Text className="mt-2 font-geist-extrabold text-[10.5px] uppercase tracking-wide text-brand-dark">
              {t('businessHome.action.measure')}
            </Text>
            <Text className="mt-0.5 font-geist-semibold text-[12.5px] text-ink dark:text-gray-100">
              {BUSINESS_HOME_ACTION_PLAN.measure}
            </Text>
            <View className="mt-2.5 flex-row flex-wrap gap-1.5">
              <LocalNotesButton
                label={t('businessHome.buttons.promoteOpportunity')}
                onPress={showComingSoon}
                variant="dark"
                size="sm"
                isRounded
                isWidthFull={false}
              />
              <LocalNotesButton
                label={t('businessHome.buttons.explain')}
                onPress={showComingSoon}
                variant="light"
                size="sm"
                isRounded
                isWidthFull={false}
              />
            </View>
          </View>
        ) : null}
      </BusinessHomeCard>
    </MembershipGate>
  );
}
