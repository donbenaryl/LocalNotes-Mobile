import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import type { AiCreditsPricingDAO, CopilotCostBreakdownDAO } from '@/http/business-api/types';
import { formatCostBreakdown, formatCostCalculation } from '@/utils/aiCredits';

interface CopilotCostSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The answer's breakdown. Without one (pending / failed) the sheet never opens. */
  breakdown: CopilotCostBreakdownDAO | null;
  pricing?: AiCreditsPricingDAO;
  onOpenHowCalculated: () => void;
}

/** "This answer used N credits": plain summary first, the exact calculation on demand. */
export function CopilotCostSheet({
  visible,
  onClose,
  breakdown,
  pricing,
  onOpenHowCalculated,
}: CopilotCostSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!breakdown) return null;

  const summary = formatCostBreakdown(breakdown, t, pricing?.max_per_answer);
  const calculation = formatCostCalculation(breakdown, t);

  return (
    <Modal
      visible={visible}
      onClose={() => {
        setExpanded(false);
        onClose();
      }}
      title={t('businessHome.copilot.costSheet.title', { count: breakdown.credits_charged })}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
        className="max-h-[70vh]"
      >
        {summary.rows.map((row) => (
          <View key={row.id} className="py-2">
            <Text className="font-geist-semibold text-xs text-gray-500 dark:text-gray-400">
              {row.label}
            </Text>
            <Text className="mt-0.5 font-geist-bold text-sm text-ink dark:text-gray-100">
              {row.value}
            </Text>
          </View>
        ))}
        <Text className="mt-1 font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">
          {summary.whyLine}
        </Text>
        {summary.capNote ? (
          <Text className="mt-2 font-geist-semibold text-[13px] text-amber-600 dark:text-amber-400">
            {summary.capNote}
          </Text>
        ) : null}

        <Pressable
          onPress={() => setExpanded((value) => !value)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          className="mt-4 active:opacity-70"
        >
          <Text className="font-geist-bold text-sm text-brand">
            {expanded
              ? t('businessHome.copilot.costSheet.hideCalculation')
              : t('businessHome.copilot.costSheet.showCalculation')}
          </Text>
        </Pressable>
        {expanded ? (
          <View className="mt-2 rounded-xl bg-soft p-3 dark:bg-gray-800">
            {calculation.lines.map((line) => (
              <Text
                key={line.id}
                className="py-1 font-geist-semibold text-[13px] text-ink dark:text-gray-100"
              >
                {line.text}
              </Text>
            ))}
            <Text className="mt-1 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
              {calculation.tokenExplainer}
            </Text>
          </View>
        ) : null}

        <Text className="mt-4 font-geist text-xs text-gray-500 dark:text-gray-400">
          {t('businessHome.copilot.costSheet.sameModelPrice')}
        </Text>
        <Pressable
          onPress={onOpenHowCalculated}
          accessibilityRole="link"
          className="mt-2 active:opacity-70"
        >
          <Text className="font-geist-bold text-sm text-brand">
            {t('businessHome.copilot.costSheet.howLink')}
          </Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}
