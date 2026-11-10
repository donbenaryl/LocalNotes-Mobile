import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useBriefActions } from '@/hooks/useBriefActions';
import { useBusinessStore } from '@/stores/useBusinessStore';
import type { BriefTranslate } from '@/utils/businessBrief';
import {
  actionCopyKeys,
  actionParams,
  activeActionSubtitle,
  pastPlanChipKey,
  progressPercent,
} from '@/utils/businessBriefAction';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';

interface PlansSheetBodyProps {
  enabled: boolean;
}

export function PlansSheetBody({ enabled }: PlansSheetBodyProps) {
  const { t, i18n } = useTranslation();
  const tr: BriefTranslate = (key, params) => t(key, params);
  const businessId = useBusinessStore((s) => s.businessId) ?? '';
  const query = useBriefActions({ businessId, enabled });
  const actions = query.data?.actions ?? [];
  const inProgress = actions.filter((a) => a.status === 'started' || a.status === 'completed');
  const past = actions.filter((a) => a.status === 'measured' || a.status === 'expired');

  if (query.isLoading) {
    return (
      <BusinessHomeCard className="mx-0 mt-2 gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-full" />
      </BusinessHomeCard>
    );
  }
  if (query.isError) {
    return (
      <BusinessHomeCard className="mx-0 mt-2">
        <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
          {t('businessHome.sheets.plans.error')}
        </Text>
        <View className="mt-2 flex-row">
          <LocalNotesButton
            label={t('businessHome.sheets.plans.retry')}
            onPress={() => void query.refetch()}
            variant="light"
            size="xs"
            isWidthFull={false}
          />
        </View>
      </BusinessHomeCard>
    );
  }
  if (actions.length === 0) {
    return (
      <BusinessHomeCard className="mx-0 mt-2">
        <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
          {t('businessHome.sheets.plans.empty')}
        </Text>
      </BusinessHomeCard>
    );
  }

  return (
    <>
      {inProgress.map((a) => (
        <BusinessHomeCard key={a.id} className="mx-0 mt-2">
          <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
            {t(actionCopyKeys(a.key).title, actionParams(a, tr))}
          </Text>
          <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <View
              className="h-full rounded-full bg-brand"
              style={{ width: `${progressPercent(a.day, a.of_days)}%` }}
            />
          </View>
          <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
            {activeActionSubtitle(a, tr, i18n.language)}
          </Text>
        </BusinessHomeCard>
      ))}
      {past.length > 0 ? (
        <Text className="mt-4 font-geist-extrabold text-[10.5px] uppercase tracking-wide text-brand-dark">
          {t('businessHome.sheets.plans.pastTitle')}
        </Text>
      ) : null}
      {past.map((a) => (
        <BusinessHomeCard key={a.id} className="mx-0 mt-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {t(actionCopyKeys(a.key).title, actionParams(a, tr))}
            </Text>
            <View className="rounded-full bg-brand-tint px-2.5 py-1 dark:bg-brand/20">
              <Text className="font-geist-semibold text-[11px] text-brand-dark">
                {t(pastPlanChipKey(a.status, a.result?.verdict))}
              </Text>
            </View>
          </View>
          {a.status === 'measured' ? (
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {activeActionSubtitle(a, tr, i18n.language)}
            </Text>
          ) : null}
        </BusinessHomeCard>
      ))}
    </>
  );
}
