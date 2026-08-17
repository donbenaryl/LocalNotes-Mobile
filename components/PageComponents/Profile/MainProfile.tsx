import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, Pressable, Share, Text, View } from "react-native";
import {
  Building2,
  Info,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
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
import {
  ProfilePullToRefreshProvider,
  useProfilePullToRefresh,
} from "./ProfilePullToRefreshContext";
import type { ProfileListTabType } from "./ProfileTabPanel";
import { useContentBottomInset } from "@/hooks/useContentBottomInset";
import accountService from "@/http/account-api/account.services";
import { HOME_HREF } from "@/constants/swipeNavigation";
import { ICON_COLOR_DARK, ICON_COLOR_LIGHT } from "@/constants/colors";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { useToastStore } from "@/stores/useToastStore";
import { isBusinessAccountType } from "@/utils/businessAccount";
import type { profileItemDAO } from "@/http/account-api/types";

const TAB_IDS: ProfileListTabType[] = [
  "my-lists",
  "saved",
  "collaborative",
  "shared-with-me",
  "picks",
  "about",
];

const PROFILE_HREF = "/(app)/(stack)/profile" as Href;

function isTabType(value: string | null | undefined): value is ProfileListTabType {
  return value !== null && value !== undefined && TAB_IDS.includes(value as ProfileListTabType);
}

/** Matches HTML vitalbar: scrollTop > 300 toggles .show */
const PROFILE_CHROME_REVEAL_THRESHOLD = 300;

interface MainProfileProps {
  userId?: string;
}

interface MainProfileContentProps {
  userId?: string;
  isOwnProfile: boolean;
  profile: profileItemDAO | null | undefined;
  isPending: boolean;
  isError: boolean;
  onProfileInfoLayout: (height: number) => void;
}

interface ProfileScrollBodyProps {
  isOwnProfile: boolean;
  isBusinessOwner: boolean;
  profile: profileItemDAO | null | undefined;
  isPending: boolean;
  profileUserId: string;
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
  profile,
  isPending,
  profileUserId,
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
    void queryClient.invalidateQueries({
      queryKey: isOwnProfile ? ["profile"] : ["profile", profileUserId],
    });
    if (isBusinessOwner) {
      void refreshBusinessInfo();
    }
  }, [
    handler,
    queryClient,
    isOwnProfile,
    profileUserId,
    isBusinessOwner,
    refreshBusinessInfo,
  ]);

  return (
    <ProfileChromeScrollView
      className="flex-1"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: contentBottomInset }}
      refreshControl={
        <AppRefreshControl
          refreshing={handler?.refreshing ?? false}
          onRefresh={handleRefresh}
        />
      }
    >
      {isPending ? (
        <>
          <ProfileInfoSkeleton />
          {isOwnProfile ? (
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
      ) : profile ? (
        <>
          <View
            onLayout={(event) => {
              onProfileInfoLayout(event.nativeEvent.layout.height);
            }}
          >
            <ProfileInfo
              profile={profile}
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
  isOwnProfile,
  profile,
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

  const [activeTab, setActiveTab] = useState<ProfileListTabType>(() => {
    return isTabType(params.tab) ? params.tab : "picks";
  });
  const [actionsOpen, setActionsOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const displayName = profile?.name?.trim() || t("common.user");
  const profileUserId = profile?.id ?? userId ?? "";
  const accountType = profile?.account_type ?? authAccountType ?? undefined;
  const isBusinessProfile = isBusinessAccountType(accountType ?? undefined);
  const isBusinessOwner = isOwnProfile && isBusinessProfile;

  const ownProfileTabs: TabItem[] = useMemo(() => {
    const base: TabItem[] = [
      { id: "picks", label: t("profile.tabs.picks"), icon: Building2 },
      { id: "my-lists", label: t("profile.tabs.myLists"), icon: LayoutGrid },
      { id: "saved", label: t("profile.tabs.saved"), icon: List },
    ];

    if (isBusinessProfile) {
      base.push({ id: "about", label: t("profile.tabs.about"), icon: Info });
    }

    return base;
  }, [isBusinessProfile, t]);

  const tabs = useMemo(() => {
    if (isOwnProfile) {
      return ownProfileTabs;
    }

    return ownProfileTabs.filter((tab) => {
      if (tab.id === "saved") return profile?.show_saved_list ?? false;
      if (tab.id === "shared-with-me") return profile?.show_shared_with_me ?? true;
      return true;
    });
  }, [
    isOwnProfile,
    ownProfileTabs,
    profile?.show_saved_list,
    profile?.show_shared_with_me,
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
      if (activeTab === "my-lists") {
        if (params.tab === undefined) return;
        router.setParams({ tab: undefined });
        return;
      }
      if (params.tab === activeTab) return;
      router.setParams({ tab: activeTab });
    });
    return () => task.cancel();
  }, [activeTab, isFocused, params.tab, router]);

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
    if (!profileUserId) return;
    const username = profile?.username ? `@${profile.username}` : displayName;
    try {
      await Share.share({
        message: `${username} on LocalNotes\n/profile/${profileUserId}`,
      });
    } catch {
      // User dismissed share sheet.
    }
  }, [displayName, profile?.username, profileUserId]);

  const blockMutation = useMutation({
    mutationFn: () => accountService.blockUser(profileUserId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      await queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
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
        href: PROFILE_HREF,
        render: () => (
          <ProfileList
            userId={profileUserId}
            isOwnProfile={isOwnProfile}
            tab={tab.id as ProfileListTabType}
            isBusinessProfile={isBusinessProfile}
            businessId={profile?.primary_business_id ?? undefined}
            businessName={profile?.primary_business_name ?? undefined}
          />
        ),
      })),
    [
      isOwnProfile,
      isBusinessProfile,
      profile?.primary_business_id,
      profile?.primary_business_name,
      profileUserId,
      tabs,
    ],
  );

  const moreIconColor =
    colorScheme === "dark" ? ICON_COLOR_DARK : ICON_COLOR_LIGHT;

  const otherProfileMenu = !isOwnProfile ? (
    <Pressable
      onPress={() => setActionsOpen(true)}
      accessibilityRole="button"
      accessibilityLabel={t("common.more")}
      className="rounded-full p-1 active:opacity-70"
      hitSlop={8}
    >
      <MoreHorizontal size={22} color={moreIconColor} strokeWidth={2} />
    </Pressable>
  ) : null;

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <ProfileChromeHeader
        onBack={handleBack}
        rightChild={isOwnProfile ? <ProfileHeader /> : otherProfileMenu}
        profile={profile}
        isOwnProfile={isOwnProfile}
        isPending={isPending}
      />
      {isError || (!isPending && !profile) ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
            Failed to load profile.
          </Text>
        </View>
      ) : (
        <ProfilePullToRefreshProvider>
          <ProfileScrollBody
            isOwnProfile={isOwnProfile}
            isBusinessOwner={isBusinessOwner}
            profile={profile}
            isPending={isPending}
            profileUserId={profileUserId}
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

      {!isOwnProfile && profileUserId ? (
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
        </>
      ) : null}
    </View>
  );
}

export default function MainProfile({ userId }: MainProfileProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnProfile = !userId || userId === currentUserId;
  const [profileInfoHeight, setProfileInfoHeight] = useState(
    PROFILE_CHROME_REVEAL_THRESHOLD,
  );

  const handleProfileInfoLayout = useCallback((height: number) => {
    if (height > 0) {
      setProfileInfoHeight(height);
    }
  }, []);

  useEffect(() => {
    if (userId && currentUserId && userId === currentUserId) {
      router.replace("/profile");
    }
  }, [userId, currentUserId, router]);

  const {
    data: profile,
    isPending,
    isError,
  } = useQuery({
    queryKey: isOwnProfile ? ["profile"] : ["profile", userId],
    queryFn: async () => {
      const response = isOwnProfile
        ? await accountService.fetchUser()
        : await accountService.fetchOtherUser(userId!);
      return response.data?.data ?? null;
    },
    enabled: isOwnProfile || Boolean(userId),
  });

  if (userId && currentUserId && userId === currentUserId) {
    return null;
  }

  const revealThreshold = profileInfoHeight * 0.5;
  const hideThreshold = Math.max(0, revealThreshold - 40);

  return (
    <ProfileChromeProvider
      revealThreshold={revealThreshold}
      hideThreshold={hideThreshold}
    >
      <MainProfileContent
        userId={userId}
        isOwnProfile={isOwnProfile}
        profile={profile}
        isPending={isPending}
        isError={isError}
        onProfileInfoLayout={handleProfileInfoLayout}
      />
    </ProfileChromeProvider>
  );
}
