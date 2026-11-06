import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProgressBar, type ProgressBarTone } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAiCredits } from '@/hooks/useAiCredits';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';
import { AI_CREDITS_ROUTE } from '@/utils/copilotRoutes';
import { levelOf, resetDateLabel, type CreditsLevel } from '@/utils/aiCredits';
import { cn } from '@/utils/cn';

interface AiCreditsMeterProps {
  variant: 'full' | 'compact';
  /** Business Home passes its `isPaidMember` (honours the `__DEV__` toggle). */
  isPaid?: boolean;
  /** Override the default tap target (the usage page). */
  onPress?: () => void;
  className?: string;
}

const TONE: Record<CreditsLevel, ProgressBarTone> = {
  normal: 'brand',
  warning: 'warning',
  empty: 'danger',
};

/**
 * AI credits left for the selected paid branch. The whole meter is a button that opens the
 * usage page. There is deliberately no purchase or top-up action (payments are web-only).
 */
export function AiCreditsMeter({ variant, isPaid, onPress, className }: AiCreditsMeterProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { branchName } = useSelectedBranch();
  const { data: credits, isPending, isError } = useAiCredits({ isPaid });

  const open = onPress ?? (() => router.push(AI_CREDITS_ROUTE as never));

  if (isPending && !isError) {
    return <Skeleton className={cn(variant === 'full' ? 'h-24 w-full' : 'h-4 w-40', className)} />;
  }
  if (!credits) return null;

  const level = levelOf(credits);
  const date = resetDateLabel(credits.resets_at, i18n.language);
  const params = {
    branchName,
    remaining: credits.remaining,
    allowance: credits.allowance,
    date,
  };

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityHint={t('businessHome.aiCredits.meter.seeCredits')}
        className={cn('active:opacity-70', className)}
      >
        <Text
          className={cn(
            'font-geist-semibold text-[11px] leading-[1.5]',
            level === 'normal' && 'text-gray-500',
            level === 'warning' && 'text-amber-600 dark:text-amber-400',
            level === 'empty' && 'text-rose-600 dark:text-rose-400',
          )}
        >
          {t('businessHome.aiCredits.meter.compact', params)}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityHint={t('businessHome.aiCredits.meter.seeCredits')}
      className={cn('active:opacity-70', className)}
    >
      <View className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <Text className="font-geist-semibold text-xs text-gray-500 dark:text-gray-400">
          {t('businessHome.aiCredits.meter.full', params)}
        </Text>
        <Text className="mt-0.5 font-geist-extrabold text-base text-ink dark:text-gray-100">
          {t('businessHome.aiCredits.meter.left', params)}
        </Text>
        <ProgressBar
          className="mt-2"
          percent={credits.percent}
          tone={TONE[level]}
          accessibilityLabel={t('businessHome.aiCredits.meter.left', params)}
        />
        <Text
          className={cn(
            'mt-2 font-geist text-[11px] leading-[1.5]',
            level === 'normal' && 'text-gray-500 dark:text-gray-400',
            level === 'warning' && 'font-geist-semibold text-amber-600 dark:text-amber-400',
            level === 'empty' && 'font-geist-semibold text-rose-600 dark:text-rose-400',
          )}
        >
          {level === 'empty'
            ? t('businessHome.aiCredits.meter.empty', params)
            : level === 'warning'
              ? t('businessHome.aiCredits.meter.low')
              : t('businessHome.aiCredits.meter.resets', params)}
        </Text>
      </View>
    </Pressable>
  );
}
