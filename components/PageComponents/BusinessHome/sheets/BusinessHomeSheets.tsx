import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { BarChart3, Heart, MapPin } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BusinessLocationCompareItemDAO } from '@/http/business-api/types';
import { EditBranchHoursModal } from '@/components/PageComponents/Profile/EditBranchHoursModal';
import { useMentionWeekdays } from '@/hooks/useMentionWeekdays';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { useUpdateBranchHours } from '@/hooks/useUpdateBranchHours';
import { useAiCredits } from '@/hooks/useAiCredits';
import { useBusinessMonthlyReport } from '@/hooks/useBusinessMonthlyReport';
import { useCampaignResults } from '@/hooks/useCampaignResults';
import { useLocationCompare } from '@/hooks/useLocationCompare';
import {
  MONTHLY_METRICS,
  formatDelta,
  formatReportMonth,
  headlineKey,
  reportView,
} from '@/utils/businessMonthlyReport';
import {
  compareSheetView,
  expireAfterLabelKey,
  formatCampaignCaption,
  formatEfficiency,
  formatSpendCents,
  insightCopyParams,
  insightHeadlineI18nKey,
  insightMeaningI18nKey,
} from '@/utils/campaignResults';
import { useSuggestBusinessDescription } from '@/hooks/useSuggestBusinessDescription';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useDescriptionDraftStore } from '@/stores/useDescriptionDraftStore';
import { useToastStore } from '@/stores/useToastStore';
import businessService from '@/http/business-api/business.service';
import { closedMentionedDays } from '@/utils/openingHours';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { KeyValueRow } from '../ui/KeyValueRow';
import { ProfileHealthSection } from '../sections/FreeCampaignSections';
import { PlansSheetBody } from './PlansSheetBody';
import type { BusinessHomeSheetId } from './types';

const CAMPAIGN_SHEETS: BusinessHomeSheetId[] = ['compare', 'snapshot', 'setup'];

interface BusinessHomeSheetsProps {
  activeSheet: BusinessHomeSheetId | null;
  isPaidMember: boolean;
  onClose: () => void;
}

function LocationCompareRow({
  row,
  rank,
  maxMentions,
  isLeader,
}: {
  row: BusinessLocationCompareItemDAO;
  rank: number;
  maxMentions: number;
  isLeader: boolean;
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const pinColor = isLeader ? '#FF6B1A' : colorScheme === 'dark' ? '#9CA3AF' : '#78716C';
  const barWidth =
    maxMentions > 0 ? Math.max(6, Math.round((row.mentions / maxMentions) * 100)) : 0;

  return (
    <View
      className={`rounded-2xl border px-3.5 py-3 ${
        isLeader
          ? 'border-brand/30 bg-brand-tint/60 dark:border-brand/40 dark:bg-brand/10'
          : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      <View className="flex-row items-start gap-2.5">
        <View
          className={`mt-0.5 h-7 w-7 items-center justify-center rounded-full ${
            isLeader ? 'bg-brand' : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          <Text
            className={`font-geist-bold text-[12px] ${
              isLeader ? 'text-white' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {rank}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <MapPin size={14} color={pinColor} />
            <Text
              className="max-w-[70%] font-geist-bold text-[14px] text-ink dark:text-gray-100"
              numberOfLines={1}
            >
              {row.name}
            </Text>
            {isLeader ? (
              <Badge label={t('businessHome.sheets.locationsCompare.leadingBadge')} variant="primary" />
            ) : null}
            {row.is_default ? (
              <Badge
                label={t('businessHome.sheets.locationsCompare.defaultBadge')}
                variant="secondary"
              />
            ) : null}
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="font-geist-extrabold text-2xl text-ink dark:text-gray-100">
                {row.mentions}
              </Text>
              <Text className="mt-0.5 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400">
                {t('businessHome.sheets.locationsCompare.mentions')}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Heart size={14} color={colorScheme === 'dark' ? '#9CA3AF' : '#78716C'} />
                <Text className="font-geist-extrabold text-2xl text-ink dark:text-gray-100">
                  {row.pick_favorites}
                </Text>
              </View>
              <Text className="mt-0.5 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400">
                {t('businessHome.sheets.locationsCompare.pickFavorites')}
              </Text>
            </View>
          </View>

          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <View
              className={`h-full rounded-full ${isLeader ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}
              style={{ width: `${barWidth}%` }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const SHEET_MAX_HEIGHT_RATIO = 0.85;
/** Drag handle + title + padding around the scroll area, so the whole sheet stays within the max. */
const SHEET_CHROME_HEIGHT = 96;

function SheetScroll({ children }: { children: React.ReactNode }) {
  const { height } = useWindowDimensions();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-8"
      style={{ maxHeight: height * SHEET_MAX_HEIGHT_RATIO - SHEET_CHROME_HEIGHT }}
    >
      {children}
    </ScrollView>
  );
}

export function BusinessHomeSheets({
  activeSheet,
  isPaidMember,
  onClose,
}: BusinessHomeSheetsProps) {
  const { t, i18n } = useTranslation();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();
  const openInsightsOnWeb = useOpenBusinessInsightsOnWeb();
  const showToast = useToastStore((s) => s.show);
  const businessId = useBusinessStore((s) => s.businessId);
  const businessInfo = useBusinessStore((s) => s.businessInfo);
  const selectedBranchId = useBusinessStore((s) => s.selectedBranchId);
  const refreshBusinessInfo = useBusinessStore((s) => s.refreshBusinessInfo);
  const [hoursEditorOpen, setHoursEditorOpen] = useState(false);
  const draft = useDescriptionDraftStore((s) => (businessId ? s.drafts[businessId] : undefined));
  const setDraft = useDescriptionDraftStore((s) => s.setDraft);
  const clearDraft = useDescriptionDraftStore((s) => s.clearDraft);
  const loadDrafts = useDescriptionDraftStore((s) => s.load);
  const [savingDraft, setSavingDraft] = useState(false);

  const selectedBranch =
    businessInfo?.branches?.find((item) => item.id === selectedBranchId) ??
    businessInfo?.branches?.[0];
  const { data: mentionWeekdays, refetch: refetchMentionWeekdays } = useMentionWeekdays(
    businessId,
    selectedBranch?.id,
  );
  const canFetchMentionWeekdays = Boolean(businessId && selectedBranch?.id);

  const profileOpen = activeSheet === 'profile';
  const { data: credits } = useAiCredits({ isPaid: isPaidMember && profileOpen });
  const suggestMutation = useSuggestBusinessDescription();
  // Same query key as the Analytics row, so an open sheet reads the cached report.
  const reportQuery = useBusinessMonthlyReport({
    businessId: businessId ?? '',
    isPaidMember,
    enabled: activeSheet === 'report',
  });
  const monthlyReport = reportQuery.data;
  const reportMonth = formatReportMonth(monthlyReport?.month_start, i18n.language);
  const reportViewState = reportView(monthlyReport);

  // Same query key as Campaign Results, so open sheets reuse the card cache.
  const campaignSheetOpen =
    activeSheet != null && CAMPAIGN_SHEETS.includes(activeSheet);
  const campaignQuery = useCampaignResults(businessId || undefined, {
    enabled: campaignSheetOpen,
  });
  const {
    campaign: campaignResults,
    previous: previousCampaign,
    insight: campaignInsight,
  } = campaignQuery;
  const compareView = compareSheetView({
    isLoading: campaignQuery.isLoading,
    isError: campaignQuery.isError,
    campaign: campaignResults,
    previous: previousCampaign,
  });
  const insightKey = campaignInsight?.headline_key ?? 'none';
  const insightParams = insightCopyParams(
    campaignInsight,
    campaignResults,
    previousCampaign,
  );

  const locationsCompareOpen = activeSheet === 'locationsCompare';
  const locationCompareQuery = useLocationCompare(businessId || undefined, {
    enabled: locationsCompareOpen,
  });
  const locationRows = locationCompareQuery.locations;
  const locationInsight = locationCompareQuery.insight;
  const hasLocationActivity = locationRows.some(
    (row) => row.mentions > 0 || row.pick_favorites > 0,
  );
  const maxLocationMentions = useMemo(
    () => locationRows.reduce((max, row) => Math.max(max, row.mentions), 0),
    [locationRows],
  );

  const suggestQuota = credits?.suggest_description;
  const suggestionsUsed = suggestQuota?.used ?? 0;
  const suggestionsLeft = suggestQuota?.remaining ?? 0;
  const atSuggestCap = isPaidMember && suggestQuota != null && suggestionsLeft < 1;
  const generating = suggestMutation.isPending;

  useEffect(() => {
    if (profileOpen && canFetchMentionWeekdays) void refetchMentionWeekdays();
  }, [profileOpen, canFetchMentionWeekdays, refetchMentionWeekdays]);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const runSuggest = useCallback(async () => {
    if (!isPaidMember) {
      void openInsightsOnWeb();
      return;
    }
    if (atSuggestCap || generating) return;
    try {
      const result = await suggestMutation.mutateAsync();
      if (businessId) setDraft(businessId, result.description);
    } catch (error) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined;
      const message =
        statusCode === 429 &&
        error instanceof Error &&
        /description drafts/i.test(error.message)
          ? t('businessHome.sheets.profile.suggestCap')
          : statusCode === 429
            ? t('businessHome.sheets.profile.suggestCredits')
            : t('businessHome.sheets.profile.suggestFailed');
      showToast({ type: 'error', message });
    }
  }, [
    atSuggestCap,
    businessId,
    generating,
    isPaidMember,
    openInsightsOnWeb,
    setDraft,
    showToast,
    suggestMutation,
    t,
  ]);

  const hoursGapDays = useMemo(
    () => closedMentionedDays(mentionWeekdays?.mentioned_days ?? [], selectedBranch?.opening_hours),
    [mentionWeekdays, selectedBranch?.opening_hours],
  );
  const hoursGapLabel = hoursGapDays
    .map((day) => t(`editProfile.business.weekdays.${day}`))
    .join(', ');

  const { mutateAsync: updateBranchHours, isPending: isUpdatingHours } = useUpdateBranchHours({
    onSuccess: () => setHoursEditorOpen(false),
  });

  const openHoursEditor = () => {
    onClose();
    setHoursEditorOpen(true);
  };

  const onUseDraft = async () => {
    if (!isPaidMember) {
      void openInsightsOnWeb();
      return;
    }
    if (!businessId || !draft?.trim() || savingDraft) return;
    setSavingDraft(true);
    try {
      const res = await businessService.updateBusiness({ bio: draft.trim() });
      if (res.error || !res.data?.data) {
        throw new Error(res.error?.message ?? t('businessHome.sheets.profile.useDraftFailed'));
      }
      clearDraft(businessId);
      await refreshBusinessInfo();
      showToast({ type: 'success', message: t('businessHome.sheets.profile.useDraftSuccess') });
      onClose();
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : t('businessHome.sheets.profile.useDraftFailed'),
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const draftText = draft?.trim() ?? '';
  const hasDraft = draftText.length > 0;
  const showPreview = generating || hasDraft;
  const draftPreview = generating ? t('businessHome.sheets.profile.draftLoading') : draftText;

  const canUseDraft = Boolean(draft?.trim()) && !generating && !savingDraft && isPaidMember;
  const canRelaunch = isPaidMember && !generating && !savingDraft && !atSuggestCap;

  return (
    <>
      <Modal
        visible={profileOpen}
        onClose={onClose}
        title={t('businessHome.sheets.profile.title')}
      >
        <SheetScroll>
          {/* Profile Health */}
          <ProfileHealthSection
            isPaidMember={isPaidMember}
            className="mx-0"
            onFixPress={onClose}
          />
          {/* Mentioned on days the branch is not open */}
          {hoursGapDays.length > 0 ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist-extrabold text-sm">
                {t('businessHome.sheets.profile.hoursTitle', { days: hoursGapLabel })}
              </Text>
              <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.profile.hoursBody', { days: hoursGapLabel })}
              </Text>
              <LocalNotesButton
                label={t('businessHome.buttons.confirmHours')}
                onPress={openHoursEditor}
                variant="dark"
                size="xs"
                isWidthFull={false}
                className="mt-2 self-start"
              />
            </BusinessHomeCard>
          ) : null}
          {/* Suggest Business Description */}
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.profile.descriptionTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.profile.descriptionBody')}
            </Text>
            {isPaidMember && suggestQuota != null ? (
              <Text
                className={`mt-2 font-geist text-xs ${
                  atSuggestCap
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {atSuggestCap
                  ? t('businessHome.sheets.profile.exhausted')
                  : t('businessHome.sheets.profile.usedLeft', {
                      used: suggestionsUsed,
                      left: suggestionsLeft,
                    })}
              </Text>
            ) : null}
            {!isPaidMember ? (
              <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.profile.upgradeForDrafts')}
              </Text>
            ) : null}
            {showPreview ? (
              <View className="mt-2 rounded-xl bg-soft p-3 dark:bg-gray-900">
                <Text
                  className={`font-fraunces text-sm italic ${
                    hasDraft && !generating
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {draftPreview}
                </Text>
              </View>
            ) : null}
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {hasDraft ? (
                <>
                  <LocalNotesButton
                    label={t('businessHome.sheets.profile.useDraft')}
                    onPress={() => void onUseDraft()}
                    variant="dark"
                    size="xs"
                    isWidthFull={false}
                    disabled={!canUseDraft && isPaidMember}
                  />
                  <LocalNotesButton
                    label={t('businessHome.buttons.editRelaunch')}
                    onPress={() => void runSuggest()}
                    variant="light"
                    size="xs"
                    isWidthFull={false}
                    disabled={isPaidMember && !canRelaunch}
                  />
                </>
              ) : (
                <LocalNotesButton
                  label={t('businessHome.sheets.profile.generate')}
                  onPress={() => void runSuggest()}
                  variant="dark"
                  size="xs"
                  isWidthFull={false}
                  disabled={isPaidMember && !canRelaunch}
                  loading={generating}
                />
              )}
            </View>
          </BusinessHomeCard>
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'plans'}
        onClose={onClose}
        title={t('businessHome.sheets.plans.title')}
      >
        <SheetScroll>
          <PlansSheetBody enabled={activeSheet === 'plans' && isPaidMember} />
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'alerts'}
        onClose={onClose}
        title={t('businessHome.sheets.alerts.title')}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.alerts.attentionTitle')}</Text>
            <Text className="mt-1 font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.alerts.attentionBody')}
            </Text>
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.alerts.opportunityTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.alerts.opportunityBody')}
            </Text>
            <LocalNotesButton
              label={t('businessHome.buttons.createOffer')}
              onPress={() => void openCreateOfferOnWeb()}
              variant="dark"
              size="xs"
              isWidthFull={false}
              className="mt-2 self-start"
            />
          </BusinessHomeCard>
        </SheetScroll>
      </Modal>

      <Modal
        visible={activeSheet === 'report'}
        onClose={onClose}
        titleIcon={<BarChart3 size={22} color="#FF6B1A" />}
        title={
          reportMonth
            ? t('businessHome.sheets.report.title', { month: reportMonth })
            : t('businessHome.sheets.report.titleFallback')
        }
      >
        <SheetScroll>
          {reportQuery.isError && !monthlyReport ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.report.error')}
              </Text>
              <LocalNotesButton
                label={t('businessHome.sheets.report.retry')}
                onPress={() => void reportQuery.refetch()}
                variant="dark"
                size="xs"
                isWidthFull={false}
                className="mt-2 self-start"
              />
            </BusinessHomeCard>
          ) : reportViewState === 'loading' || reportViewState === 'building' ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {reportMonth
                  ? t('businessHome.sheets.report.building', { month: reportMonth })
                  : t('businessHome.sheets.report.buildingNoMonth')}
              </Text>
            </BusinessHomeCard>
          ) : reportViewState === 'insufficient' && monthlyReport ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist-extrabold text-sm">
                {t('businessHome.sheets.report.insufficientTitle')}
              </Text>
              <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.report.insufficientBody', { month: reportMonth })}
              </Text>
              {monthlyReport.insufficient ? (
                <Text className="mt-1 font-geist-bold text-xs text-gray-600 dark:text-gray-400">
                  {t('businessHome.sheets.report.insufficientProgress', {
                    current: monthlyReport.insufficient.current,
                    needed: monthlyReport.insufficient.needed,
                  })}
                </Text>
              ) : null}
            </BusinessHomeCard>
          ) : monthlyReport ? (
            <>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t('businessHome.sheets.report.oneLineTitle')}
                </Text>
                <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                  {t(headlineKey(monthlyReport.status), {
                    month: reportMonth,
                    visitors: monthlyReport.volume.visitors ?? 0,
                    savers: monthlyReport.volume.savers ?? 0,
                    listAdds: monthlyReport.volume.list_adds ?? 0,
                  })}
                </Text>
              </BusinessHomeCard>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t('businessHome.sheets.report.metricsTitle')}
                </Text>
                {MONTHLY_METRICS.map((metric) => {
                  const delta = monthlyReport.deltas[metric];
                  const label = formatDelta(delta);
                  return (
                    <View key={metric} className="mt-1.5 flex-row items-baseline gap-2">
                      <Text className="flex-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                        {t(`businessHome.sheets.report.metrics.${metric}`)}
                      </Text>
                      <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                        {monthlyReport.volume[metric] ?? 0}
                      </Text>
                      {label ? (
                        <Text
                          className={`font-geist-bold text-xs ${
                            (delta ?? 0) > 0 ? 'text-success' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {label}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </BusinessHomeCard>
            </>
          ) : null}
        </SheetScroll>
      </Modal>

      {/* Compare Locations */}
      <Modal
        visible={locationsCompareOpen}
        onClose={onClose}
        title={t('businessHome.sheets.locationsCompare.title')}
      >
        <SheetScroll>
          {locationCompareQuery.isError ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.locationsCompare.error')}
              </Text>
              <LocalNotesButton
                label={t('businessHome.sheets.locationsCompare.retry')}
                onPress={() => void locationCompareQuery.refetch()}
                variant="dark"
                size="xs"
                isWidthFull={false}
                className="mt-2.5 self-start"
              />
            </BusinessHomeCard>
          ) : locationCompareQuery.isLoading ? (
            <View className="mt-2 gap-2.5">
              <BusinessHomeCard className="mx-0">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-3 h-3 w-full" />
              </BusinessHomeCard>
              {[0, 1].map((key) => (
                <View
                  key={key}
                  className="rounded-2xl border border-gray-100 bg-white px-3.5 py-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <View className="flex-row items-center gap-2.5">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </View>
                  <View className="mt-3 flex-row gap-3">
                    <Skeleton className="h-8 w-14" />
                    <Skeleton className="h-8 w-14" />
                  </View>
                  <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
                </View>
              ))}
            </View>
          ) : locationRows.length < 2 ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.locationsCompare.needTwo')}
              </Text>
            </BusinessHomeCard>
          ) : !hasLocationActivity ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.locationsCompare.empty')}
              </Text>
            </BusinessHomeCard>
          ) : (
            <View className="mt-2 gap-2.5">
              <BusinessHomeCard className="mx-0">
                <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
                  {t('businessHome.sheets.locationsCompare.headline')}
                </Text>
                {locationInsight ? (
                  <Text className="mt-1.5 font-geist text-[12.5px] leading-[1.5] text-gray-600 dark:text-gray-400">
                    {t('businessHome.sheets.locationsCompare.insight', {
                      leader: locationInsight.leader.name,
                      leaderCount: locationInsight.leader.mentions,
                      laggard: locationInsight.laggard.name,
                      laggardCount: locationInsight.laggard.mentions,
                    })}
                  </Text>
                ) : null}
              </BusinessHomeCard>

              {locationRows.map((row, index) => (
                <LocationCompareRow
                  key={row.branch_id}
                  row={row}
                  rank={index + 1}
                  maxMentions={maxLocationMentions}
                  isLeader={index === 0 && row.mentions > 0}
                />
              ))}
            </View>
          )}
        </SheetScroll>
      </Modal>

      {/* Compare Campaigns */}
      <Modal
        visible={activeSheet === 'compare'}
        onClose={onClose}
        title={t('businessHome.sheets.compare.title')}
      >
        <SheetScroll>
          {compareView === 'error' ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.compare.error')}
              </Text>
              <LocalNotesButton
                label={t('businessHome.sheets.compare.retry')}
                onPress={() => void campaignQuery.refetch()}
                variant="dark"
                size="xs"
                isWidthFull={false}
                className="mt-2 self-start"
              />
            </BusinessHomeCard>
          ) : compareView === 'loading' ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.compare.loading')}
              </Text>
            </BusinessHomeCard>
          ) : compareView === 'empty' ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.compare.empty')}
              </Text>
            </BusinessHomeCard>
          ) : compareView === 'single' && campaignResults ? (
            <>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t('businessHome.sheets.compare.headline')}
                </Text>
                <View className="mt-3">
                  <Text className="font-geist-extrabold text-2xl text-ink dark:text-gray-100">
                    {formatEfficiency(campaignInsight?.current_redeemed_per_dollar)}
                  </Text>
                  <Text className="mt-1 text-[11px] text-gray-500">
                    {formatCampaignCaption(campaignResults)}
                  </Text>
                </View>
              </BusinessHomeCard>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t('businessHome.sheets.compare.meaningTitle')}
                </Text>
                <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                  {t('businessHome.sheets.compare.insufficient')}
                </Text>
              </BusinessHomeCard>
            </>
          ) : campaignResults && previousCampaign ? (
            <>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t(insightHeadlineI18nKey(insightKey), insightParams)}
                </Text>
                <View className="mt-3 flex-row gap-4">
                  <View className="flex-1">
                    <Text className="font-geist-extrabold text-2xl text-success">
                      {formatEfficiency(campaignInsight?.current_redeemed_per_dollar)}
                    </Text>
                    <Text className="mt-1 text-[11px] text-gray-500">
                      {formatCampaignCaption(campaignResults)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-geist-extrabold text-2xl text-ink dark:text-gray-100">
                      {formatEfficiency(campaignInsight?.previous_redeemed_per_dollar)}
                    </Text>
                    <Text className="mt-1 text-[11px] text-gray-500">
                      {formatCampaignCaption(previousCampaign)}
                    </Text>
                  </View>
                </View>
              </BusinessHomeCard>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t('businessHome.sheets.compare.meaningTitle')}
                </Text>
                <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                  {t(insightMeaningI18nKey(insightKey), insightParams)}
                </Text>
              </BusinessHomeCard>
            </>
          ) : null}
        </SheetScroll>
      </Modal>

      {/* Insight snapshot */}
      <Modal
        visible={activeSheet === 'snapshot'}
        onClose={onClose}
        title={t('businessHome.sheets.snapshot.title')}
      >
        <SheetScroll>
          {campaignQuery.isError && !campaignResults ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.snapshot.error')}
              </Text>
              <LocalNotesButton
                label={t('businessHome.sheets.snapshot.retry')}
                onPress={() => void campaignQuery.refetch()}
                variant="dark"
                size="xs"
                isWidthFull={false}
                className="mt-2 self-start"
              />
            </BusinessHomeCard>
          ) : campaignQuery.isLoading ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.snapshot.loading')}
              </Text>
            </BusinessHomeCard>
          ) : !campaignResults ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.snapshot.empty')}
              </Text>
            </BusinessHomeCard>
          ) : (
            <>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t('businessHome.sheets.snapshot.metricsTitle')}
                </Text>
                <Text className="mt-1 font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
                  {campaignResults.name}
                </Text>
                <View className="mt-2 flex-row gap-4">
                  <View>
                    <Text className="font-geist-extrabold text-lg text-ink dark:text-gray-100">
                      {formatSpendCents(
                        campaignResults.spend_cents,
                        campaignResults.currency,
                      )}
                    </Text>
                    <Text className="text-[10px] uppercase text-gray-500">
                      {t('businessHome.campaign.spend')}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-geist-extrabold text-lg text-ink dark:text-gray-100">
                      {campaignResults.redeemed}
                    </Text>
                    <Text className="text-[10px] uppercase text-gray-500">
                      {t('businessHome.campaign.redeemed')}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-geist-extrabold text-lg text-ink dark:text-gray-100">
                      {formatEfficiency(campaignInsight?.current_redeemed_per_dollar)}
                    </Text>
                    <Text className="text-[10px] uppercase text-gray-500">
                      {t('businessHome.campaign.efficiency')}
                    </Text>
                  </View>
                </View>
              </BusinessHomeCard>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-sm">
                  {t('businessHome.sheets.snapshot.insightTitle')}
                </Text>
                <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                  {t(insightHeadlineI18nKey(insightKey), insightParams)}
                </Text>
                <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
                  {t(insightMeaningI18nKey(insightKey), insightParams)}
                </Text>
              </BusinessHomeCard>
            </>
          )}
        </SheetScroll>
      </Modal>

      {/* Campaign setup */}
      <Modal
        visible={activeSheet === 'setup'}
        onClose={onClose}
        title={t('businessHome.sheets.setup.title')}
      >
        <SheetScroll>
          {campaignQuery.isError && !campaignResults ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.setup.error')}
              </Text>
              <LocalNotesButton
                label={t('businessHome.sheets.setup.retry')}
                onPress={() => void campaignQuery.refetch()}
                variant="dark"
                size="xs"
                isWidthFull={false}
                className="mt-2 self-start"
              />
            </BusinessHomeCard>
          ) : campaignQuery.isLoading ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <View className="gap-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="mt-1 h-6 w-24" />
              </View>
            </BusinessHomeCard>
          ) : !campaignResults ? (
            <BusinessHomeCard className="mx-0 mt-2">
              <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
                {t('businessHome.sheets.setup.empty')}
              </Text>
            </BusinessHomeCard>
          ) : (
            <>
              <BusinessHomeCard className="mx-0 mt-2">
                <Text className="font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
                  {campaignResults.name}
                </Text>
                <Text className="mt-1 font-geist text-[13px] leading-[1.55] text-gray-600 dark:text-gray-400">
                  {campaignResults.description?.trim()
                    ? campaignResults.description
                    : t('businessHome.sheets.setup.noDescription')}
                </Text>
                <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5">
                  <Badge
                    label={
                      campaignResults.status === 'active'
                        ? t('businessHome.sheets.setup.statusActive')
                        : t('businessHome.sheets.setup.statusEnded')
                    }
                    variant={
                      campaignResults.status === 'active' ? 'success' : 'secondary'
                    }
                  />
                  <Badge
                    label={`${t('businessHome.sheets.setup.redeemable')}: ${
                      campaignResults.is_redeemable
                        ? t('businessHome.sheets.setup.redeemableYes')
                        : t('businessHome.sheets.setup.redeemableNo')
                    }`}
                    variant={campaignResults.is_redeemable ? 'primary' : 'secondary'}
                  />
                </View>
              </BusinessHomeCard>
              <BusinessHomeCard className="mx-0 mt-2">
                <KeyValueRow
                  label={t('businessHome.sheets.setup.duration.label')}
                  value={t(expireAfterLabelKey(campaignResults.expire_after))}
                />
                <KeyValueRow
                  label={t('businessHome.sheets.setup.expires')}
                  value={
                    campaignResults.expires_at
                      ? new Date(campaignResults.expires_at).toLocaleDateString(
                          i18n.language,
                        )
                      : t('businessHome.sheets.setup.expiresNever')
                  }
                />
                <KeyValueRow
                  label={t('businessHome.sheets.setup.spend')}
                  value={formatSpendCents(
                    campaignResults.spend_cents,
                    campaignResults.currency,
                  )}
                />
              </BusinessHomeCard>
            </>
          )}
        </SheetScroll>
      </Modal>

      <EditBranchHoursModal
        visible={hoursEditorOpen && Boolean(selectedBranch)}
        branchName={
          (businessInfo?.branches?.length ?? 0) > 1 ? selectedBranch?.name ?? undefined : undefined
        }
        initialHours={selectedBranch?.opening_hours}
        loading={isUpdatingHours}
        onClose={() => setHoursEditorOpen(false)}
        onSave={async (hours) => {
          if (!selectedBranch) return;
          try {
            await updateBranchHours({ branchId: selectedBranch.id, openingHours: hours });
          } catch {
            // Error toast is shown by useUpdateBranchHours.
          }
        }}
      />
    </>
  );
}
