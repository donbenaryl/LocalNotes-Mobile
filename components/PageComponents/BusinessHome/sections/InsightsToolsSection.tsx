import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { copilotHref } from '@/utils/copilotRoutes';
import { AiCreditsMeter } from '../ui/AiCreditsMeter';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';

interface InsightsToolsSectionProps {
  isPaidMember: boolean;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

export function InsightsToolsSection({
  isPaidMember,
  onOpenSheet,
}: InsightsToolsSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const tools: { id: string; icon: string; labelKey: string; onPress: () => void }[] = [
    {
      id: 'ask-copilot',
      icon: '✦',
      labelKey: 'businessHome.tools.copilot',
      onPress: () => router.push(copilotHref()),
    },
    {
      id: 'profile',
      icon: '✎',
      labelKey: 'businessHome.tools.improveProfile',
      onPress: () => onOpenSheet('profile'),
    },
    {
      id: 'plans',
      icon: '⚑',
      labelKey: 'businessHome.tools.actionPlans',
      onPress: () => onOpenSheet('plans'),
    },
    // {
    //   id: 'alerts',
    //   icon: '🔔',
    //   labelKey: 'businessHome.tools.alerts',
    //   onPress: () => onOpenSheet('alerts'),
    // },
  ];

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
        {tools.map((tool) => (
          <LocalNotesButton
            key={tool.id}
            label={t(tool.labelKey)}
            onPress={tool.onPress}
            variant="light"
            size="xs"
            isWidthFull={false}
            leftIcon={<Text className="text-brand">{tool.icon}</Text>}
          />
        ))}
      </ScrollView>
      <AiCreditsMeter variant="compact" isPaid={isPaidMember} className="px-5 pt-1.5" />
    </MembershipGate>
  );
}
