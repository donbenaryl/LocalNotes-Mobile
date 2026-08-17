import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BUSINESS_HOME_USAGE } from '@/constants/businessHomeMock';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';

interface InsightsToolsSectionProps {
  isPaidMember: boolean;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

const TOOLS: { id: BusinessHomeSheetId; icon: string; labelKey: string }[] = [
  { id: 'copilot', icon: '✦', labelKey: 'businessHome.tools.copilot' },
  { id: 'profile', icon: '✎', labelKey: 'businessHome.tools.improveProfile' },
  { id: 'plans', icon: '⚑', labelKey: 'businessHome.tools.actionPlans' },
  { id: 'alerts', icon: '🔔', labelKey: 'businessHome.tools.alerts' },
];

export function InsightsToolsSection({
  isPaidMember,
  onOpenSheet,
}: InsightsToolsSectionProps) {
  const { t } = useTranslation();

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <Text className="px-5 pb-1.5 pt-3.5 font-geist-extrabold text-[10px] uppercase tracking-widest text-gray-500">
        {t('businessHome.sections.insightsTools')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1.5 px-4"
      >
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.id}
            onPress={() => onOpenSheet(tool.id)}
            accessibilityRole="button"
            className="min-h-10 flex-row items-center gap-1.5 rounded-full bg-paper px-3.5 shadow-sm dark:bg-gray-800"
          >
            <Text className="text-brand">{tool.icon}</Text>
            <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
              {t(tool.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="px-5 pt-1.5 font-geist-semibold text-[11px] leading-[1.5] text-gray-500">
        {BUSINESS_HOME_USAGE}
      </Text>
    </MembershipGate>
  );
}
