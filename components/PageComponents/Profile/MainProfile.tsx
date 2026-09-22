import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  InteractionManager,
  Platform,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import {
  Building2,
  Info,
  LayoutGrid,
  List,
  MessageSquareQuote,
  MoreVertical,
  Tag,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import type { ViewOrigin } from "@/http/types";
import { withViewOrigin } from "@/utils/viewTracking";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  SectionPager,
  type SectionPagerPage,
} from "@/components/ui/SectionPager";
import { ProfileChromeScrollView } from "@/components/ui/ProfileChromeScrollView";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfoSkeleton } from "./ProfileInfoSkeleton";
import { ProfileList } from "./ProfileList";
import { ProfilePicksTabSkeleton } from "./ProfilePicksTabSkeleton";
import { ProfileChromeHeader } from "./ProfileChromeHeader";
import {
  ProfileChromeProvider,
  useProfileChrome,
} from "./ProfileChromeProvider";
import {
  ProfileActionsSheet,
  type ProfileActionKey,
} from "./ProfileActionsSheet";
import { BlockUserModal } from "./BlockUserModal";
import { ReportUserSheet } from "@/components/PageComponents/Safety/ReportUserSheet";
import {
  ProfilePullToRefreshProvider,
  useProfilePullToRefresh,
} from "./ProfilePullToRefreshContext";
import type { ProfileListTabType } from "./ProfileTabPanel";
import { useContentBottomInset } from "@/hooks/useContentBottomInset";
import accountService from "@/http/account-api/account.services";
import businessService from "@/http/business-api/business.service";
import type { BusinessItemDAO } from "@/http/business-api/types";
import { HOME_HREF } from "@/constants/swipeNavigation";
import { ICON_COLOR_DARK, ICON_COLOR_LIGHT } from "@/constants/colors";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useToastStore } from "@/stores/useToastStore";
import { isBusinessAccountType } from "@/utils/businessAccount";
import type { profileItemDAO } from "@/http/account-api/types";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

const TAB_IDS: ProfileListTabType[] = [
  "my-lists",
  "saved",
  "offers",
  "collaborative",
  "shared-with-me",
  "picks",
  "reviews",
  "about",
];

const PROFILE_HREF = "/(app)/(stack)/profile" as Href;
const BUSINESS_HREF = "/(app)/(stack)/business/[businessId]" as Href;

function isTabType(value: string | null | undefined): value is ProfileListTabType {
  return value !== null && value !== undefined && TAB_IDS.includes(value as ProfileListTabType);
}

/** Matches HTML vitalbar: scrollTop > 300 toggles .show */
const PROFILE_CHROME_REVEAL_THRESHOLD = 300;

interface MainProfileProps {
  userId?: string;
  businessId?: string;
  viewOrigin?: ViewOrigin;
}

interface MainProfileContentProps {
  userId?: string;
  businessId?: string;
  isOwnProfile: boolean;
  isBusinessPage: boolean;
  profile: profileItemDAO | null | undefined;
  business: BusinessItemDAO | null | undefined;
  isPending: boolean;
  isError: boolean;
  onProfileInfoLayout: (height: number) => void;
}

interface ProfileScrollBodyProps {
  isOwnProfile: boolean;
  isBusinessOwner: boolean;
  isBusinessPage: boolean;
  profile: profileItemDAO | null | undefined;
  business: BusinessItemDAO | null | undefined;
  isPending: boolean;
  profileUserId: string;
  primaryBusinessId?: string;
  tabs: TabItem[];
  activeTab: ProfileListTabType;
  pages: SectionPagerPage[];
  onTabChange: (tabId: string) => void;
  onEditPress: () => void;
  onSharePress: () => void;
  onProfileInfoLayout: (height: number) => void;
}

function ProfileScrollBody({
  isOwnProfile,
  isBusinessOwner,
  isBusinessPage,
  profile,
  business,
  isPending,
  profileUserId,
  primaryBusinessId,
  tabs,
  activeTab,
  pages,
  onTabChange,
  onEditPress,
  onSharePress,
  onProfileInfoLayout,
}: ProfileScrollBodyProps) {
  const queryClient = useQueryClient();
  // Profile is a (stack) route — GuardedFooter is only mounted over (tabs).
  const contentBottomInset = useContentBottomInset(false);
  const { handler } = useProfilePullToRefresh();
  const refreshBusinessInfo = useBusinessStore((s) => s.refreshBusinessInfo);

  const handleRefresh = useCallback(() => {
    handler?.onRefresh();
    if (isBusinessPage && primaryBusinessId) {
      void queryClient.invalidateQueries({
        queryKey: ["business", primaryBusinessId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["business-offers", primaryBusinessId],
      });
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: isOwnProfile ? ["profile"] : ["profile", profileUserId],
    });
    void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    void queryClient.invalidateQueries({ queryKey: ["reviews-summary"] });
    if (isOwnProfile) {
      void queryClient.invalidateQueries({ queryKey: ["review-connections"] });
    }
    if (isBusinessOwner) {
      void refreshBusinessInfo();
    }
    if (primaryBusinessId) {
      void queryClient.invalidateQueries({
        queryKey: ["business-offers", primaryBusinessId],
      });
    }
  }, [
    handler,
    queryClient,
    isOwnProfile,
    isBusinessPage,
    profileUserId,
    isBusinessOwner,
    refreshBusinessInfo,
    primaryBusinessId,
  ]);

  const hasEntity = isBusinessPage ? Boolean(business) : Boolean(profile);

  return (
    <ProfileChromeScrollView
      style={{ flex: 1 }}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: contentBottomInset }}
      // RefreshControl blanks the profile scroll body on Android (same as KAV).
      refreshControl={
        Platform.OS === "android" ? undefined : (
          <AppRefreshControl
            refreshing={handler?.refreshing ?? false}
            onRefresh={handleRefresh}
          />
        )
      }
    >
      {isPending ? (
        <>
          <ProfileInfoSkeleton />
          {isOwnProfile || isBusinessPage ? (
            <View className="px-4 pt-4">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={onTabChange}
                className="border-b-0"
              />
            </View>
          ) : null}
          <View className="p-4">
            <ProfilePicksTabSkeleton />
          </View>
        </>
      ) : hasEntity ? (
        <>
          <View
            onLayout={(event) => {
              onProfileInfoLayout(event.nativeEvent.layout.height);
            }}
          >
            <ProfileInfo
              profile={profile}
              business={business}
              isOwnProfile={isOwnProfile}
              onEditPress={onEditPress}
              onSharePress={onSharePress}
            />
          </View>
          <View className="px-4 pt-4">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              className="border-b-0"
            />
          </View>
          <SectionPager
            embedded
            lazy
            pages={pages}
            activeId={activeTab}
            onActiveIdChange={onTabChange}
          />
        </>
      ) : null}
    </ProfileChromeScrollView>
  );
}

function MainProfileContent({
  userId,
  businessId,
  isOwnProfile,
  isBusinessPage,
  profile,
  business,
  isPending,
  isError,
  onProfileInfoLayout,
}: MainProfileContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams<{ tab?: string }>();
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const { resetChrome } = useProfileChrome();
  const authAccountType = useAuthStore((s) => s.accountType);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [activeTab, setActiveTab] = useState<ProfileListTabType>(() => {
    if (isTabType(params.tab)) return params.tab;
    return "picks";
  });
  const [actionsOpen, setActionsOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const displayName =
    (isBusinessPage ? business?.name : profile?.name)?.trim() ||
    t("common.user");
  const profileUserId = profile?.id ?? userId ?? "";
  // Business page About/By: always scope "By" to the business primary owner account.
  const ownerAccountId = business?.owner_account_id?.trim() || "";
  const listUserId = isBusinessPage ? ownerAccountId : profileUserId;
  const listIsOwnProfile = isBusinessPage
    ? Boolean(ownerAccountId) && ownerAccountId === currentUserId
    : isOwnProfile;
  const accountType = profile?.account_type ?? authAccountType ?? undefined;
  const isBusinessProfile =
    isBusinessPage || isBusinessAccountType(accountType ?? undefined);
  const isBusinessOwner =
    isOwnProfile && (isBusinessPage || isBusinessProfile);

  const primaryBusinessId = isBusinessPage
    ? businessId ?? business?.id
    : profile?.primary_business_id ?? undefined;

  const ownProfileTabs: TabItem[] = useMemo(() => {
    if (isBusinessPage) {
      return [
        { id: "picks", label: t("profile.tabs.picks"), icon: Building2 },
        { id: "my-lists", label: t("profile.tabs.myLists"), icon: LayoutGrid },
        { id: "offers", label: t("profile.tabs.offers"), icon: Tag },
        { id: "about", label: t("profile.tabs.about"), icon: Info },
      ];
    }

    const base: TabItem[] = [
      { id: "picks", label: t("profile.tabs.picks"), icon: Building2 },
      {
        id: "reviews",
        label: t("profile.tabs.reviews"),
        icon: MessageSquareQuote,
      },
      { id: "my-lists", label: t("profile.tabs.myLists"), icon: LayoutGrid },
      { id: "saved", label: t("profile.tabs.saved"), icon: List },
    ];

    if (isBusinessProfile && primaryBusinessId) {
      base.push({ id: "offers", label: t("profile.tabs.offers"), icon: Tag });
      base.push({ id: "about", label: t("profile.tabs.about"), icon: Info });
    }

    return base;
  }, [isBusinessPage, isBusinessProfile, primaryBusinessId, t]);

  const tabs = useMemo(() => {
    if (isBusinessPage || isOwnProfile) {
      return ownProfileTabs;
    }

    return ownProfileTabs.filter((tab) => {
      if (tab.id === "saved") return profile?.show_saved_list ?? false;
      if (tab.id === "shared-with-me") return profile?.show_shared_with_me ?? true;
      if (tab.id === "reviews") return (profile?.review_count ?? 0) > 0;
      return true;
    });
  }, [
    isBusinessPage,
    isOwnProfile,
    ownProfileTabs,
    profile?.show_saved_list,
    profile?.show_shared_with_me,
    profile?.review_count,
  ]);

  const visibleTabIds = useMemo(
    () => new Set(tabs.map((tab) => tab.id)),
    [tabs],
  );

  useEffect(() => {
    resetChrome();
    return () => resetChrome();
  }, [activeTab, resetChrome]);

  useEffect(() => {
    if (isTabType(params.tab) && visibleTabIds.has(params.tab)) {
      setActiveTab(params.tab);
    } else if (params.tab && !visibleTabIds.has(params.tab)) {
      setActiveTab("picks");
    }
  }, [params.tab, visibleTabIds]);

  useEffect(() => {
    if (!isFocusedRef.current) return;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isFocusedRef.current) return;
      if (!isBusinessPage && activeTab === "my-lists") {
        if (params.tab === undefined) return;
        router.setParams({ tab: undefined });
        return;
      }
      if (params.tab === activeTab) return;
      router.setParams({ tab: activeTab });
    });
    return () => task.cancel();
  }, [activeTab, isFocused, isBusinessPage, params.tab, router]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (!visibleTabIds.has(tabId)) return;
      setActiveTab(tabId as ProfileListTabType);
    },
    [visibleTabIds],
  );

  const handleBack = useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate(HOME_HREF);
    }
  }, [router]);

  const handleShare = useCallback(async () => {
    if (isBusinessPage) {
      if (!primaryBusinessId) return;
      try {
        await Share.share({
          message: `${displayName} on LocalNotes\n${withViewOrigin(
            `/businesses/${primaryBusinessId}`,
            "share_link",
          )}`,
        });
      } catch {
        // User dismissed share sheet.
      }
      return;
    }

    if (!profileUserId) return;
    const username = profile?.username ? `@${profile.username}` : displayName;
    try {
      await Share.share({
        message: `${username} on LocalNotes\n${withViewOrigin(
          `/profile/${profileUserId}`,
          "share_link",
        )}`,
      });
    } catch {
      // User dismissed share sheet.
    }
  }, [
    displayName,
    isBusinessPage,
    primaryBusinessId,
    profile?.username,
    profileUserId,
  ]);

  const blockMutation = useMutation({
    mutationFn: () => accountService.blockUser(profileUserId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["blocked-users"] }),
        queryClient.invalidateQueries({ queryKey: ["home"] }),
        queryClient.invalidateQueries({ queryKey: ["home-lists"] }),
        queryClient.invalidateQueries({ queryKey: ["home-picks"] }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
        queryClient.invalidateQueries({ queryKey: ["spotlight"] }),
        queryClient.invalidateQueries({ queryKey: ["following"] }),
        queryClient.invalidateQueries({ queryKey: ["list-comments"] }),
      ]);
      showToast({ type: "success", message: t("profile.safety.blockSuccess") });
      setBlockOpen(false);
      handleBack();
    },
    onError: () => {
      showToast({ type: "error", message: t("profile.safety.blockError") });
    },
  });

  const handleAction = useCallback(
    (action: ProfileActionKey) => {
      if (action === "share") {
        setActionsOpen(false);
        void handleShare();
        return;
      }
      if (action === "report") {
        setActionsOpen(false);
        setReportOpen(true);
        return;
      }
      if (action === "block") {
        setActionsOpen(false);
        setBlockOpen(true);
      }
    },
    [handleShare],
  );

  const pages: SectionPagerPage[] = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        href: isBusinessPage ? BUSINESS_HREF : PROFILE_HREF,
        render: () => (
          <ProfileList
            userId={listUserId}
            isOwnProfile={listIsOwnProfile}
            tab={tab.id as ProfileListTabType}
            isBusinessProfile={isBusinessProfile}
            isBusinessPage={isBusinessPage}
            businessId={primaryBusinessId}
            businessName={
              isBusinessPage
                ? business?.name
                : profile?.primary_business_name ?? undefined
            }
            business={isBusinessPage ? business : undefined}
          />
        ),
      })),
    [
      listIsOwnProfile,
      isBusinessPage,
      isBusinessProfile,
      primaryBusinessId,
      business,
      profile?.primary_business_name,
      listUserId,
      tabs,
    ],
  );

  const moreIconColor =
    colorScheme === "dark" ? ICON_COLOR_DARK : ICON_COLOR_LIGHT;

  const otherProfileMenu =
    !isOwnProfile && !isBusinessPage ? (
      <Pressable
        onPress={() => setActionsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("common.more")}
        className="rounded-full p-1 active:opacity-70"
        hitSlop={8}
      >
        <MoreVertical size={22} color={moreIconColor} strokeWidth={2} />
      </Pressable>
    ) : null;

  const loadErrorMessage = isBusinessPage
    ? t("profile.info.businessLoadError")
    : t("profile.info.loadError");

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <ProfileChromeHeader
        onBack={handleBack}
        rightChild={
          isOwnProfile && !isBusinessPage ? <ProfileHeader /> : otherProfileMenu
        }
        profile={isBusinessPage ? undefined : profile}
        business={isBusinessPage ? business : undefined}
        isOwnProfile={isOwnProfile}
        isPending={isPending}
      />
      {isError ||
      (!isPending &&
        !(isBusinessPage ? business : profile)) ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
            {loadErrorMessage}
          </Text>
        </View>
      ) : (
        <ProfilePullToRefreshProvider activeTabId={activeTab}>
          <ProfileScrollBody
            isOwnProfile={isOwnProfile}
            isBusinessOwner={isBusinessOwner}
            isBusinessPage={isBusinessPage}
            profile={profile}
            business={business}
            isPending={isPending}
            profileUserId={profileUserId}
            primaryBusinessId={primaryBusinessId}
            tabs={tabs}
            activeTab={activeTab}
            pages={pages}
            onTabChange={handleTabChange}
            onEditPress={() => router.push("/(app)/(stack)/edit-profile")}
            onSharePress={() => {
              void handleShare();
            }}
            onProfileInfoLayout={onProfileInfoLayout}
          />
        </ProfilePullToRefreshProvider>
      )}

      {!isOwnProfile && !isBusinessPage && profileUserId ? (
        <>
          <ProfileActionsSheet
            visible={actionsOpen}
            onClose={() => setActionsOpen(false)}
            displayName={displayName}
            onAction={handleAction}
          />
          <BlockUserModal
            visible={blockOpen}
            onClose={() => setBlockOpen(false)}
            displayName={displayName}
            onConfirm={() => blockMutation.mutate()}
            isLoading={blockMutation.isPending}
          />
          <ReportUserSheet
            visible={reportOpen}
            onClose={() => setReportOpen(false)}
            userId={profileUserId}
            displayName={displayName}
            contentType="profile"
          />
        </>
      ) : null}
    </View>
  );
}

export default function MainProfile({
  userId,
  businessId,
  viewOrigin = "other",
}: MainProfileProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const storeBusinessId = useBusinessStore((s) => s.businessId);
  const ownedBusinesses = useBusinessStore((s) => s.ownedBusinesses);
  const isBusinessPage = Boolean(businessId);

  const isOwnBusiness =
    isBusinessPage &&
    Boolean(businessId) &&
    (storeBusinessId === businessId ||
      ownedBusinesses.some((b) => b.id === businessId));

  const isOwnProfile = isBusinessPage
    ? isOwnBusiness
    : !userId || userId === currentUserId;

  const [profileInfoHeight, setProfileInfoHeight] = useState(
    PROFILE_CHROME_REVEAL_THRESHOLD,
  );

  const handleProfileInfoLayout = useCallback((height: number) => {
    if (height > 0) {
      setProfileInfoHeight(height);
    }
  }, []);

  useEffect(() => {
    if (isBusinessPage) return;
    if (userId && currentUserId && userId === currentUserId) {
      router.replace("/profile");
    }
  }, [userId, currentUserId, router, isBusinessPage]);

  const {
    data: profile,
    isPending: isProfilePending,
    isError: isProfileError,
  } = useQuery({
    queryKey: isOwnProfile && !isBusinessPage ? ["profile"] : ["profile", userId],
    queryFn: async () => {
      const response =
        !userId || userId === currentUserId
          ? await accountService.fetchUser()
          : await accountService.fetchOtherUser(userId!);
      return response.data?.data ?? null;
    },
    enabled: !isBusinessPage && (isOwnProfile || Boolean(userId)),
    staleTime: FEED_STALE_TIME_MS,
  });

  const {
    data: business,
    isPending: isBusinessPending,
    isError: isBusinessError,
  } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const response = await businessService.getBusinessById(businessId!);
      return response.data?.data ?? null;
    },
    enabled: isBusinessPage && Boolean(businessId),
    staleTime: FEED_STALE_TIME_MS,
  });

  const viewedProfileIdRef = useRef<string | null>(null);
  const viewedBusinessIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isBusinessPage || isOwnProfile || !profile?.id) return;
    if (viewedProfileIdRef.current === profile.id) return;
    viewedProfileIdRef.current = profile.id;
    void accountService.viewProfile(profile.id, {
      source: "mobile",
      origin: viewOrigin,
    });
  }, [isBusinessPage, isOwnProfile, profile?.id, viewOrigin]);

  useEffect(() => {
    if (!isBusinessPage || !business?.id) return;
    if (viewedBusinessIdRef.current === business.id) return;
    viewedBusinessIdRef.current = business.id;
    void businessService.recordView(business.id, {
      source: "mobile",
      origin: viewOrigin,
    });
  }, [isBusinessPage, business?.id, viewOrigin]);

  if (!isBusinessPage && userId && currentUserId && userId === currentUserId) {
    return null;
  }

  const revealThreshold = profileInfoHeight * 0.5;
  const hideThreshold = Math.max(0, revealThreshold - 40);

  const isPending = isBusinessPage ? isBusinessPending : isProfilePending;
  const isError = isBusinessPage ? isBusinessError : isProfileError;

  return (
    <ProfileChromeProvider
      revealThreshold={revealThreshold}
      hideThreshold={hideThreshold}
    >
      <MainProfileContent
        userId={userId}
        businessId={businessId}
        isOwnProfile={isOwnProfile}
        isBusinessPage={isBusinessPage}
        profile={isBusinessPage ? undefined : profile}
        business={isBusinessPage ? business : undefined}
        isPending={isPending}
        isError={isError}
        onProfileInfoLayout={handleProfileInfoLayout}
      />
    </ProfileChromeProvider>
  );
}
