import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  Building2,
  LayoutGrid,
  List,
  ListChecks,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { ProfileChromeScrollView } from "@/components/ui/ProfileChromeScrollView";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfoSkeleton } from "./ProfileInfoSkeleton";
import { ProfileList } from "./ProfileList";
import { ProfilePicksTabSkeleton } from "./ProfilePicksTabSkeleton";
import { ProfileStickyInfoBar } from "./ProfileStickyInfoBar";
import {
  ProfileChromeProvider,
  useProfileChrome,
} from "./ProfileChromeProvider";
import type { ProfileListTabType } from "./ProfileTabPanel";
import accountService from "@/http/account-api/account.services";
import { useAuthStore } from "@/stores/useAuthStore";
import type { profileItemDAO } from "@/http/account-api/types";

const TAB_IDS: ProfileListTabType[] = [
  "my-lists",
  "saved",
  "collaborative",
  "contributed",
  "shared-with-me",
  "picks",
];

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
}

function MainProfileContent({
  userId,
  isOwnProfile,
  profile,
  isPending,
  isError,
}: MainProfileContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const { hideProgress, resetChrome } = useProfileChrome();

  const stickyOverlayAnimatedStyle = useAnimatedStyle(() => {
    const progress = hideProgress.value;
    return {
      opacity: progress,
      paddingTop: insets.top,
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [-8, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
      pointerEvents: progress > 0.5 ? ("auto" as const) : ("none" as const),
    };
  });

  const [activeTab, setActiveTab] = useState<ProfileListTabType>(() => {
    return isTabType(params.tab) ? params.tab : "picks";
  });

  const ownProfileTabs: TabItem[] = [
    { id: "picks", label: t("profile.tabs.picks"), icon: Building2 },
    { id: "my-lists", label: t("profile.tabs.myLists"), icon: LayoutGrid },
    { id: "saved", label: t("profile.tabs.saved"), icon: List },
    // { id: "shared-with-me", label: t("profile.tabs.sharedWithMe"), icon: Share2 },
    { id: "contributed", label: t("profile.tabs.contributed"), icon: ListChecks },
  ];

  const tabs = useMemo(() => {
    if (isOwnProfile) {
      return ownProfileTabs;
    }

    return ownProfileTabs.filter((tab) => {
      if (tab.id === "saved") return profile?.show_saved_list ?? false;
      if (tab.id === "contributed") return profile?.show_contributed_lists ?? true;
      if (tab.id === "shared-with-me") return profile?.show_shared_with_me ?? true;
      return true;
    });
  }, [
    isOwnProfile,
    profile?.show_saved_list,
    profile?.show_contributed_lists,
    profile?.show_shared_with_me,
    t,
  ]);

  const visibleTabIds = useMemo(() => new Set(tabs.map((tab) => tab.id)), [tabs]);

  useEffect(() => {
    resetChrome();
    return () => resetChrome();
  }, [resetChrome]);

  useEffect(() => {
    if (isTabType(params.tab) && visibleTabIds.has(params.tab)) {
      setActiveTab(params.tab);
    } else if (params.tab && !visibleTabIds.has(params.tab)) {
      setActiveTab("picks");
    }
  }, [params.tab, visibleTabIds]);

  useEffect(() => {
    if (activeTab === "my-lists") {
      if (params.tab === undefined) return;
      router.setParams({ tab: undefined });
      return;
    }
    if (params.tab === activeTab) return;
    router.setParams({ tab: activeTab });
  }, [activeTab, params.tab, router]);

  const handleTabChange = (tabId: string) => {
    if (!visibleTabIds.has(tabId)) return;
    setActiveTab(tabId as ProfileListTabType);
  };

  const listHeader = (
    <View>
      <PageHeader
        onBack={() => router.back()}
        borderless
        rightChild={isOwnProfile ? <ProfileHeader /> : undefined}
      />
      {isPending ? (
        <ProfileInfoSkeleton />
      ) : profile ? (
        <ProfileInfo
          profile={profile}
          isOwnProfile={isOwnProfile}
          onEditPress={() => router.push("/(app)/(stack)/edit-profile")}
          onSharePress={() => {}}
        />
      ) : null}
      {!isPending && 
        <View className="pt-4 px-4">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="border-b-0"
          />
        </View>
      }
    </View>
  );

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      {isPending ? (
        <ProfileChromeScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="p-4"
        >
          {listHeader}
          <ProfilePicksTabSkeleton />
        </ProfileChromeScrollView>
      ) : isError || !profile ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
            Failed to load profile.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <ProfileList
            userId={profile.id ?? userId ?? ""}
            isOwnProfile={isOwnProfile}
            activeTab={activeTab}
            listHeader={listHeader}
          />
          <Animated.View
            className="absolute left-0 right-0 top-0 z-10 border-b-0 bg-white/95 dark:bg-gray-900/95"
            style={stickyOverlayAnimatedStyle}
          >
            <View className="h-12 justify-end">
              <ProfileStickyInfoBar
                profile={profile}
                isOwnProfile={isOwnProfile}
              />
            </View>
            <View className="pt-4 px-4">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                className="border-b-0"
              />
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

export default function MainProfile({ userId }: MainProfileProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnProfile = !userId || userId === currentUserId;

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

  return (
    <ProfileChromeProvider revealThreshold={PROFILE_CHROME_REVEAL_THRESHOLD}>
      <MainProfileContent
        userId={userId}
        isOwnProfile={isOwnProfile}
        profile={profile}
        isPending={isPending}
        isError={isError}
      />
    </ProfileChromeProvider>
  );
}
