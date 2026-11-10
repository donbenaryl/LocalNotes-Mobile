import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import {
  useCompleteBriefAction,
  useDismissBriefAction,
  useStartBriefAction,
} from '@/hooks/useBriefActionMutations';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useToastStore } from '@/stores/useToastStore';
import type { BusinessWeeklyBriefDAO } from '@/http/business-api/types';
import {
  footnoteParams,
  formatBriefPeriod,
  insightCopyKeys,
  insightParams,
  type BriefTranslate,
} from '@/utils/businessBrief';
import {
  actionCopyKeys,
  actionParams,
  activeActionSubtitle,
  canMarkDone,
  completedLine,
  ctaDestination,
  metricName,
  noActionLine,
} from '@/utils/businessBriefAction';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';

interface NextActionsSectionProps {
  isPaidMember: boolean;
  brief: BusinessWeeklyBriefDAO | undefined;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
  onOpenCustomers: () => void;
  onOpenCampaign: () => void;
}

export function NextActionsSection({
  isPaidMember,
  brief,
  onOpenSheet,
  onOpenCustomers,
  onOpenCampaign,
}: NextActionsSectionProps) {
  const { t, i18n } = useTranslation();
  const tr: BriefTranslate = (key, params) => t(key, params);
  const router = useRouter();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();
  const businessId = useBusinessStore((s) => s.businessId) ?? '';
  const showToast = useToastStore((s) => s.show);
  const [expanded, setExpanded] = useState(false);

  const start = useStartBriefAction(businessId);
  const complete = useCompleteBriefAction(businessId);
  const dismiss = useDismissBriefAction(businessId);

  const fail = () => showToast({ type: 'error', message: t('businessHome.action.error') });

  const runCta = (cta: string) => {
    const dest = ctaDestination(cta);
    if (!dest) return;
    if (dest.kind === 'offer_web') void openCreateOfferOnWeb();
    else if (dest.kind === 'route') router.push(dest.path);
    else if (dest.name === 'customers') onOpenCustomers();
    else onOpenCampaign();
  };

  const active = brief?.active_action ?? null;
  const suggested = brief?.action && brief.action.status === 'suggested' ? brief.action : null;

  const renderActive = () => {
    if (!active) return null;
    const keys = actionCopyKeys(active.key);
    const params = actionParams(active, tr);
    const inProgress = canMarkDone(active.status);
    const doneButton = (
      <LocalNotesButton
        label={t('businessHome.action.buttons.done')}
        onPress={() => complete.mutate(active.id, { onError: fail })}
        loading={complete.isPending}
        variant="dark"
        size="xs"
        isWidthFull={false}
      />
    );
    const viewPlanButton = (
      <LocalNotesButton
        label={t('businessHome.buttons.viewPlan')}
        onPress={() => onOpenSheet('plans')}
        variant="light"
        size="xs"
        isWidthFull={false}
      />
    );

    if (!inProgress) {
      const doneLine = completedLine(active, tr, i18n.language);
      return (
        <BusinessHomeCard className="flex-row items-center gap-3">
          <Text className="text-base">⚑</Text>
          <View className="min-w-0 flex-1">
            <Text className="font-geist-extrabold text-[13.5px] text-ink dark:text-gray-100">
              {t(keys.title, params)}
            </Text>
            {doneLine ? (
              <Text className="mt-0.5 font-geist-semibold text-xs text-ink dark:text-gray-100">
                {doneLine}
              </Text>
            ) : null}
            <Text className="mt-0.5 font-geist text-xs text-gray-600 dark:text-gray-400">
              {activeActionSubtitle(active, tr, i18n.language)}
            </Text>
          </View>
          <View className="items-end gap-1.5">{viewPlanButton}</View>
        </BusinessHomeCard>
      );
    }

    // Started: keep the task visible so the owner knows what to do and can jump back to it.
    return (
      <BusinessHomeCard>
        <View className="flex-row items-start gap-3">
          <Text className="text-base">⚑</Text>
          <View className="min-w-0 flex-1">
            <Text className="font-geist-extrabold text-[13.5px] text-ink dark:text-gray-100">
              {t(keys.title, params)}
            </Text>
            <Text className="mt-0.5 font-geist text-xs text-gray-600 dark:text-gray-400">
              {activeActionSubtitle(active, tr, i18n.language)}
            </Text>
          </View>
        </View>
        <Text className="mt-2.5 font-geist-extrabold text-[10.5px] uppercase tracking-wide text-brand-dark">
          {t('businessHome.action.recommendedStep')}
        </Text>
        <Text className="mt-0.5 font-geist-semibold text-[12.5px] text-ink dark:text-gray-100">
          {t(keys.step, params)}
        </Text>
        <Text className="mt-1.5 font-geist text-xs text-gray-600 dark:text-gray-400">
          {t('businessHome.action.measureLine', {
            metric: metricName(active.target_metric, tr),
          })}
        </Text>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          {ctaDestination(active.cta) ? (
            <LocalNotesButton
              label={t('businessHome.action.buttons.continue')}
              onPress={() => runCta(active.cta)}
              variant="dark"
              size="xs"
              isWidthFull={false}
            />
          ) : null}
          {doneButton}
          {viewPlanButton}
        </View>
      </BusinessHomeCard>
    );
  };

  const renderSuggested = () => {
    if (!suggested || !brief) return null;
    const keys = actionCopyKeys(suggested.key);
    const params = actionParams(suggested, tr);
    const insight = brief.insight;
    const evidence = insight
      ? t(insightCopyKeys(insight).evidence, insightParams(insight, tr))
      : null;
    const period = formatBriefPeriod(brief.week_start, brief.week_end, i18n.language);
    const foot = footnoteParams(brief.volume);
    const confidence = insight?.confidence;
    const busy = start.isPending || dismiss.isPending;

    const onStart = () =>
      start.mutate(suggested.id, {
        onSuccess: () => runCta(suggested.cta),
        onError: fail,
      });

    return (
      <BusinessHomeCard className={active ? 'mt-2 overflow-hidden p-0' : 'overflow-hidden p-0'}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          className="px-4 py-3"
        >
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
              {t(keys.title, params)}
            </Text>
            <ChevronDown
              size={15}
              color="#78716C"
              style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
            />
          </View>
          <Text className="mt-1 font-geist text-[12.5px] text-gray-600 dark:text-gray-400">
            {t(keys.summary, params)}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-2.5">
            <Text className="font-geist-bold text-[11px] text-gray-600 dark:text-gray-400">
              {t('businessHome.action.effort')}{' '}
              <Text className="text-ink dark:text-gray-100">
                {t(`businessHome.action.level.${suggested.effort}`)}
              </Text>
            </Text>
            {confidence ? (
              <Text className="font-geist-bold text-[11px] text-gray-600 dark:text-gray-400">
                {t('businessHome.action.confidence')}{' '}
                <Text className="text-ink dark:text-gray-100">
                  {t(`businessHome.action.level.${confidence}`)}
                </Text>
              </Text>
            ) : null}
          </View>
        </Pressable>
        {expanded ? (
          <View className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            {evidence ? (
              <Text className="font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
                {evidence}
              </Text>
            ) : null}
            <Text className="mt-1.5 font-geist-semibold text-[11px] text-gray-500">
              {t('businessHome.action.source', { period, ...foot })}
            </Text>
            <Text className="mt-2 font-geist-extrabold text-[10.5px] uppercase tracking-wide text-brand-dark">
              {t('businessHome.action.recommendedStep')}
            </Text>
            <Text className="mt-0.5 font-geist-semibold text-[12.5px] text-ink dark:text-gray-100">
              {t(keys.step, params)}
            </Text>
            <Text className="mt-2 font-geist-extrabold text-[10.5px] uppercase tracking-wide text-brand-dark">
              {t('businessHome.action.measure')}
            </Text>
            <Text className="mt-0.5 font-geist-semibold text-[12.5px] text-ink dark:text-gray-100">
              {t('businessHome.action.measureLine', {
                metric: metricName(suggested.target_metric, tr),
              })}
            </Text>
            <View className="mt-2.5 flex-row flex-wrap gap-1.5">
              <LocalNotesButton
                label={t('businessHome.action.buttons.start')}
                onPress={onStart}
                loading={start.isPending}
                disabled={busy}
                variant="dark"
                size="sm"
                isWidthFull={false}
              />
              <LocalNotesButton
                label={t('businessHome.action.buttons.notNow')}
                onPress={() => dismiss.mutate(suggested.id, { onError: fail })}
                loading={dismiss.isPending}
                disabled={busy}
                variant="light"
                size="sm"
                isWidthFull={false}
              />
            </View>
          </View>
        ) : null}
      </BusinessHomeCard>
    );
  };

  const renderNoAction = () => {
    if (!brief || suggested) return null;
    const line = noActionLine(brief.status, brief.insight?.params?.already_tracking === true);
    if (!line) return null;
    return (
      <Text className="px-5 pb-1 pt-1 font-geist text-[12.5px] text-gray-500 dark:text-gray-400">
        {t(`businessHome.action.${line}`)}
      </Text>
    );
  };

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <SectionHeading title={t('businessHome.sections.nextActions')} />
      {renderActive()}
      {renderSuggested()}
      {renderNoAction()}
    </MembershipGate>
  );
}
