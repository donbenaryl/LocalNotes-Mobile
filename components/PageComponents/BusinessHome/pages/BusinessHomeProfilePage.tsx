import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { ChevronDown } from 'lucide-react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { AppRefreshControl } from '@/components/ui/AppRefreshControl';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { BusinessHomeTopline } from '../BusinessHomeTopline';
import { BusinessSwitcherSheet } from '../sheets/BusinessSwitcherSheet';
import { AlertsSection } from '../sections/AlertsSection';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { DateRangePicker } from '../ui/DateRangePicker';
import { SectionHeading } from '../ui/SectionHeading';
import { ThankYouContent } from '@/components/PageComponents/ThankYou/ThankYouContent';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { BUSINESS_HOME_CAMPAIGN } from '@/constants/businessHomeMock';
import { resolveImageUrl } from '@/utils/httpHelpers';
import type { BusinessHomeTopTabId } from '../navigation';
import type { BusinessHomeSheetId } from '../sheets/types';
import { BusinessInsightsSections } from '../sections/BusinessInsightsSections';

/** Reveal sticky tabs when in-flow tabs are almost off-screen (matches home). */
const REVEAL_SLACK_PX = 8;
/** Hide hysteresis band — same gap as SectionTabsScrollLayout. */
const HIDE_SLACK_PX = 40;

interface BusinessHomeProfilePageProps {
  businessName: string;
  businessLogo?: string | null;
  locationName: string;
  managerName: string;
  roleLabel: string;
  topline: {
    views: string;
    saves: string;
    redeemed: string;
    lists: string;
  };
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  onDateRangeChange: (range: { dateFrom: string; dateTo: string }) => void;
  isPaidMember: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onToggleMembership?: () => void;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
  onOpenFullInsights: () => void;
  onOpenCampaign: () => void;
}

export function BusinessHomeProfilePage({
  businessName,
  businessLogo,
  locationName,
  managerName,
  roleLabel,
  topline,
  periodLabel,
  dateFrom,
  dateTo,
  onDateRangeChange,
  isPaidMember,
  isRefetching,
  onRefresh,
  onBack,
  onToggleMembership,
  onOpenSheet,
  onOpenFullInsights,
  onOpenCampaign,
}: BusinessHomeProfilePageProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();
  const [activeTab, setActiveTab] = useState<BusinessHomeTopTabId>('insights');
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [stickyTabsVisible, setStickyTabsVisible] = useState(false);
  const tabsYRef = useRef(0);
  const stickyVisibleRef = useRef(false);
  const chevronColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';
  const logoUri = resolveImageUrl(businessLogo);
  const initialLetter = businessName.trim().charAt(0).toUpperCase() || '?';

  const tabs = useMemo<TabItem[]>(
    () => [
      { id: 'insights', label: t('businessHome.tabs.insights') },
      { id: 'campaigns', label: t('businessHome.tabs.campaigns') },
      { id: 'alerts', label: t('businessHome.tabs.alerts') },
      { id: 'thankYou', label: t('businessHome.tabs.thankYou') },
    ],
    [t],
  );

  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id as BusinessHomeTopTabId);
  }, []);

  const handleTabsLayout = useCallback((event: LayoutChangeEvent) => {
    tabsYRef.current = event.nativeEvent.layout.y;
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const tabsY = tabsYRef.current;
      if (tabsY <= 0) return;

      const revealAt = tabsY - REVEAL_SLACK_PX;
      const hideAt = tabsY - HIDE_SLACK_PX;
      let nextVisible = stickyVisibleRef.current;

      if (y > revealAt) {
        nextVisible = true;
      } else if (y < hideAt) {
        nextVisible = false;
      }

      if (stickyVisibleRef.current !== nextVisible) {
        stickyVisibleRef.current = nextVisible;
        setStickyTabsVisible(nextVisible);
      }
    },
    [],
  );

  return (
    <View style={styles.fill} className="bg-page dark:bg-gray-900">
      <PageHeader title="" onBack={onBack} borderless />

      <View style={styles.scrollHost}>
        <AppScrollView
          style={styles.fill}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          refreshControl={
            Platform.OS === 'android' ? undefined : (
              <AppRefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
            )
          }
        >
          {/* Business Info */}
          <View className="px-4">
            <View className="mb-2 h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand">
              {logoUri ? (
                <Image
                  source={{ uri: logoUri }}
                  accessibilityLabel={businessName}
                  className="h-full w-full"
                />
              ) : (
                <Text className="font-geist-extrabold text-2xl text-white">
                  {initialLetter}
                </Text>
              )}
            </View>
            <Text className="font-geist-bold text-3xl text-ink dark:text-gray-100">
              {businessName}
            </Text>
            <Pressable
              onPress={() => setSwitcherVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={
                locationName ? `${businessName}, ${locationName}` : businessName
              }
              className="flex-row items-center self-start border-b border-dashed border-gray-500 dark:border-gray-400"
            >
              {locationName ? (
                <>
                  <Text className="font-geist-semibold text-sm leading-[16px] text-gray-500 dark:text-gray-400">
                    {locationName}
                  </Text>
                  <ChevronDown size={11} color={chevronColor} strokeWidth={2.4} />
                </>
              ) : (
                <Text className="font-geist-semibold text-sm leading-[16px] text-gray-500 dark:text-gray-400">
                  {t('businessHome.switcher.locations')}
                </Text>
              )}
            </Pressable>
            <Pressable
              onLongPress={__DEV__ ? onToggleMembership : undefined}
              accessibilityRole="text"
            >
              <Text className="mt-0.5 font-geist-semibold text-sm text-gray-500 dark:text-gray-400">
                {t('businessHome.managingAs', {
                  name: managerName,
                  role: roleLabel,
                })}
              </Text>
            </Pressable>
          </View>

          <View onLayout={handleTabsLayout}>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              className="mx-4 mt-6"
            />
          </View>

          {activeTab === 'insights' ? (
            <View className="pt-2">
              <View className="px-4">
                <View className="self-end">
                  <DateRangePicker
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    displayValue={periodLabel}
                    onChange={onDateRangeChange}
                  />
                </View>
              </View>
              <BusinessHomeTopline {...topline} />
              <BusinessInsightsSections isPaidMember={isPaidMember} />
              <View className="mt-3 px-4">
                <LocalNotesButton
                  label={t('businessHome.openFullInsights')}
                  onPress={onOpenFullInsights}
                  variant="dark"
                  size="sm"
                />
              </View>
            </View>
          ) : null}

          {activeTab === 'campaigns' ? (
            <View className="pt-1">
              <SectionHeading title={t('businessHome.campaignsTab.active')} />
              <Text className="px-5 pb-2 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
                {t('businessHome.campaignsTab.activeEmpty')}
              </Text>
              <View className="px-4 pb-2">
                <LocalNotesButton
                  label={t('businessHome.buttons.createOffer')}
                  onPress={() => void openCreateOfferOnWeb()}
                  variant="brand"
                  size="sm"
                />
              </View>
              <SectionHeading title={t('businessHome.campaignsTab.past')} />
              <BusinessHomeCard>
                <Pressable
                  onPress={onOpenCampaign}
                  accessibilityRole="button"
                  className="active:opacity-70"
                >
                  <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100">
                    {BUSINESS_HOME_CAMPAIGN.name}
                  </Text>
                  <View className="mt-1 flex-row items-center justify-between gap-2">
                    <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                      {BUSINESS_HOME_CAMPAIGN.status}
                    </Text>
                    <Text className="font-geist-bold text-xs text-success">
                      {BUSINESS_HOME_CAMPAIGN.roas} ROAS
                    </Text>
                  </View>
                </Pressable>
              </BusinessHomeCard>
            </View>
          ) : null}

          {activeTab === 'alerts' ? (
            <View className="pt-1">
              <AlertsSection isPaidMember={isPaidMember} />
            </View>
          ) : null}

          {activeTab === 'thankYou' ? <ThankYouContent embedded /> : null}
        </AppScrollView>

        {stickyTabsVisible ? (
          <View style={styles.stickyHost} pointerEvents="box-none">
            <View className="bg-page/95 px-4 pt-2 dark:bg-gray-900/95">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </View>
          </View>
        ) : null}
      </View>

      <BusinessSwitcherSheet
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollHost: {
    flex: 1,
    minHeight: 0,
  },
  /** Top-anchored only — must not fill the screen or it steals feed touches. */
  stickyHost: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
