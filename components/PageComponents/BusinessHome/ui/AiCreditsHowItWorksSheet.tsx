import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import type { AiCreditsPricingDAO } from '@/http/business-api/types';

interface AiCreditsHowItWorksSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Live server values; the sheet shows a spinner until they have loaded. */
  pricing?: AiCreditsPricingDAO;
}

function Heading({ children }: { children: string }) {
  return (
    <Text className="mt-4 font-geist-extrabold text-sm text-ink dark:text-gray-100">
      {children}
    </Text>
  );
}

function Body({ children }: { children: string }) {
  return (
    <Text className="mt-1 font-geist text-[13px] leading-[1.55] text-gray-600 dark:text-gray-400">
      {children}
    </Text>
  );
}

/** "How credits are calculated", built from the live `pricing` the credits endpoint serves. */
export function AiCreditsHowItWorksSheet({
  visible,
  onClose,
  pricing,
}: AiCreditsHowItWorksSheetProps) {
  const { t } = useTranslation();
  const base = 'businessHome.aiCredits.howCalculated';

  const params = pricing
    ? {
        weight: pricing.output_weight,
        perCredit: pricing.tokens_per_credit.toLocaleString('en-US'),
        min: pricing.min_per_answer,
        max: pricing.max_per_answer,
        count: pricing.monthly_per_branch,
      }
    : null;

  return (
    <Modal visible={visible} onClose={onClose} title={t(`${base}.title`)} sheetHeightRatio={0.85}>
      {params ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
          className="max-h-[75vh]"
        >
          <Body>{t(`${base}.intro`)}</Body>

          {(['count', 'weight', 'divide', 'limits'] as const).map((step, index) => (
            <View key={step} className="mt-3 flex-row gap-3">
              <Text className="font-geist-extrabold text-sm text-brand">{index + 1}</Text>
              <Text className="flex-1 font-geist text-[13px] leading-[1.55] text-ink dark:text-gray-100">
                {t(`${base}.steps.${step}`, params)}
              </Text>
            </View>
          ))}

          <View className="mt-4 rounded-xl bg-soft p-3 dark:bg-gray-800">
            <Text className="font-geist-semibold text-[13px] text-ink dark:text-gray-100">
              {t(`${base}.formula`, params)}
            </Text>
          </View>

          <Heading>{t(`${base}.typicalTitle`)}</Heading>
          {(['quick', 'oneCheck', 'several'] as const).map((row) => (
            <Body key={row}>{t(`${base}.typicalRows.${row}`)}</Body>
          ))}

          <Heading>{t(`${base}.allowanceTitle`)}</Heading>
          <Body>{t(`${base}.allowance`, params)}</Body>

          <Heading>{t(`${base}.tipsTitle`)}</Heading>
          {(['t1', 't2', 't3'] as const).map((tip) => (
            <Body key={tip}>{`• ${t(`${base}.tips.${tip}`)}`}</Body>
          ))}

          <Heading>{t(`${base}.rulesTitle`)}</Heading>
          {(['r1', 'r2', 'r3'] as const).map((rule) => (
            <Body key={rule}>{`• ${t(`${base}.rules.${rule}`)}`}</Body>
          ))}

          <Text className="mt-4 font-geist text-xs text-gray-500 dark:text-gray-400">
            {t(`${base}.sameModelPrice`)}
          </Text>
        </ScrollView>
      ) : (
        <View className="items-center py-10">
          <ActivityIndicator color="#FF6B1A" />
        </View>
      )}
    </Modal>
  );
}
