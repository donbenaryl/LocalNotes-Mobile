import { Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import type { BusinessWeeklyBriefDAO } from '@/http/business-api/types';
import {
  audienceChips,
  footnoteParams,
  formatBriefPeriod,
  formatEvidenceRows,
  insightCopyKeys,
  insightParams,
  insufficientCopy,
  quietCopy,
  supportingDataTarget,
  type BriefTranslate,
} from '@/utils/businessBrief';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';

interface ThisWeekSectionProps {
  isPaidMember: boolean;
  brief: BusinessWeeklyBriefDAO | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpenFindYou: () => void;
  onOpenCustomers: () => void;
  onOpenCampaign: () => void;
}

export function ThisWeekSection({
  isPaidMember,
  brief,
  isLoading,
  isError,
  onRetry,
  onOpenFindYou,
  onOpenCustomers,
  onOpenCampaign,
}: ThisWeekSectionProps) {
  const { t, i18n } = useTranslation();
  const tr: BriefTranslate = (key, params) => t(key, params);
  const period = brief ? formatBriefPeriod(brief.week_start, brief.week_end, i18n.language) : '';

  const openSupportingData = (key: string) => {
    const target = supportingDataTarget(key);
    if (target === 'findyou') onOpenFindYou();
    else if (target === 'campaign') onOpenCampaign();
    else onOpenCustomers();
  };

  const renderBody = () => {
    if (isLoading && !brief) {
      return (
        <View className="mt-3 gap-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </View>
      );
    }
    if (isError && !brief) {
      return (
        <View className="mt-2">
          <Text className="font-geist text-[13.5px] text-gray-600 dark:text-gray-400">
            {t('businessHome.brief.error')}
          </Text>
          <View className="mt-2.5 flex-row">
            <LocalNotesButton
              label={t('businessHome.brief.retry')}
              onPress={onRetry}
              variant="light"
              size="sm"
              isWidthFull={false}
            />
          </View>
        </View>
      );
    }
    if (!brief || brief.status === 'building') {
      return (
        <Text className="mt-2 font-geist text-[13.5px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t('businessHome.brief.firstBriefSoon')}
        </Text>
      );
    }
    if (brief.status === 'insufficient_data') {
      const copy = insufficientCopy(brief.insufficient);
      return (
        <Text className="mt-2 font-geist text-[13.5px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t(copy.key, copy.params)}
        </Text>
      );
    }
    if (brief.status === 'quiet' || !brief.insight) {
      const copy = quietCopy(brief.summary);
      return (
        <Text className="mt-2 font-geist text-[13.5px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t(copy.key, copy.params)}
        </Text>
      );
    }

    const insight = brief.insight;
    const keys = insightCopyKeys(insight);
    const params = insightParams(insight, tr);
    const chips = audienceChips(insight, tr);
    return (
      <>
        <Text className="mt-2 font-geist-bold text-[15px] leading-snug text-ink dark:text-gray-100">
          {t(keys.headline, params)}
        </Text>
        <Text className="mt-1.5 font-geist text-[13.5px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t(keys.evidence, params)}
        </Text>
        <Text className="mt-1.5 font-geist text-[13.5px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t(keys.why, params)}
        </Text>
        {chips.length > 0 ? (
          <View className="mt-2.5 flex-row flex-wrap gap-1.5">
            {chips.map((chip) => (
              <View
                key={chip}
                className="rounded-full bg-brand-tint px-2.5 py-1 dark:bg-brand/20"
              >
                <Text className="font-geist-semibold text-[11.5px] text-brand-dark">{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Text className="mt-2.5 font-geist text-[11.5px] text-gray-500 dark:text-gray-400">
          {t('businessHome.brief.basedOn', footnoteParams(brief.volume))}
        </Text>
        <View className="mt-2.5 flex-row">
          <LocalNotesButton
            label={t('businessHome.buttons.supportingData')}
            onPress={() => openSupportingData(insight.key)}
            variant="light"
            size="sm"
            isWidthFull={false}
          />
        </View>
      </>
    );
  };

  const evidenceRows =
    brief?.status === 'insight' && brief.insight
      ? formatEvidenceRows(brief.insight.evidence_rows, tr)
      : [];

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <SectionHeading title={t('businessHome.sections.thisWeek')} />
      <BusinessHomeCard variant="brief">
        <View className="flex-row items-center gap-2">
          <View className="h-[22px] w-[22px] items-center justify-center rounded-md bg-brand">
            <Sparkles size={12} color="#fff" />
          </View>
          <Text className="font-geist-extrabold text-[10.5px] uppercase tracking-widest text-brand-dark">
            {t('businessHome.brief.kicker', { period })}
          </Text>
        </View>
        {renderBody()}
      </BusinessHomeCard>

      {evidenceRows.length > 0 ? (
        <BusinessHomeCard className="mt-2">
          {evidenceRows.map((row, index) => (
            <View
              key={`${row.label}-${index}`}
              className={`flex-row items-center gap-2.5 py-2 ${
                index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
              }`}
            >
              <Text className="flex-1 font-geist-bold text-[13px] text-ink dark:text-gray-100">
                {row.label}
              </Text>
              <Text className="font-geist-semibold text-xs text-brand">{row.value}</Text>
              {row.was ? (
                <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                  {row.was}
                </Text>
              ) : null}
            </View>
          ))}
        </BusinessHomeCard>
      ) : null}
    </MembershipGate>
  );
}
