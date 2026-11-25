import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const TOTAL_STEPS = 3;

interface OnboardingStepperProps {
  current: 1 | 2 | 3;
  total?: number;
  className?: string;
}

export function OnboardingStepper({
  current,
  total = TOTAL_STEPS,
  className,
}: OnboardingStepperProps) {
  const { t } = useTranslation();
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <View className="flex-row items-center gap-1.5">
        {steps.map((step) => {
          const isCurrent = step === current;
          const isCompleted = step < current;
          return (
            <View
              key={step}
              className={cn(
                'h-1.5 w-6 rounded-full',
                isCurrent && 'bg-ink dark:bg-dk-text',
                isCompleted && 'bg-gray-400 dark:bg-dk-muted',
                !isCurrent && !isCompleted && 'bg-gray-200 dark:bg-dk-select',
              )}
            />
          );
        })}
      </View>
      <Text className="font-geist-semibold text-[13px] text-gray-500 dark:text-dk-muted">
        {t('common.stepOf', { current, total })}
      </Text>
    </View>
  );
}
