import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { EditBranchHoursModal } from '@/components/PageComponents/Profile/EditBranchHoursModal';
import { useMentionWeekdays } from '@/hooks/useMentionWeekdays';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { useUpdateBranchHours } from '@/hooks/useUpdateBranchHours';
import { useAiCredits } from '@/hooks/useAiCredits';
import { useBusinessMonthlyReport } from '@/hooks/useBusinessMonthlyReport';
import {
  MONTHLY_METRICS,
  formatDelta,
  formatReportMonth,
  headlineKey,
  reportView,
} from '@/utils/businessMonthlyReport';
import { useSuggestBusinessDescription } from '@/hooks/useSuggestBusinessDescription';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useDescriptionDraftStore } from '@/stores/useDescriptionDraftStore';
import { useToastStore } from '@/stores/useToastStore';
import businessService from '@/http/business-api/business.service';
import { closedMentionedDays } from '@/utils/openingHours';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { ProfileHealthSection } from '../sections/FreeCampaignSections';
import { PlansSheetBody } from './PlansSheetBody';
import type { BusinessHomeSheetId } from './types';

interface BusinessHomeSheetsProps {
  activeSheet: BusinessHomeSheetId | null;
  isPaidMember: boolean;
  onClose: () => void;
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

      <Modal
        visible={activeSheet === 'compare'}
        onClose={onClose}
        title={t('businessHome.sheets.compare.title')}
      >
        <SheetScroll>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.compare.headline')}</Text>
            <View className="mt-3 flex-row gap-4">
              <View>
                <Text className="font-geist-extrabold text-2xl text-success">15.4×</Text>
                <Text className="text-[11px] text-gray-500">{t('businessHome.sheets.compare.campaignA')}</Text>
              </View>
              <View>
                <Text className="font-geist-extrabold text-2xl text-ink dark:text-gray-100">4.1×</Text>
                <Text className="text-[11px] text-gray-500">{t('businessHome.sheets.compare.campaignB')}</Text>
              </View>
            </View>
          </BusinessHomeCard>
          <BusinessHomeCard className="mx-0 mt-2">
            <Text className="font-geist-extrabold text-sm">{t('businessHome.sheets.compare.meaningTitle')}</Text>
            <Text className="mt-1 font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.sheets.compare.meaningBody')}
            </Text>
          </BusinessHomeCard>
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
