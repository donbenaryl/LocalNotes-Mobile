import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import {
  Building2,
  LayoutGrid,
  List,
  ListChecks,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  SectionPager,
  type SectionPagerPage,
} from "@/components/ui/SectionPager";
import { ProfileChromeScrollView } from "@/components/ui/ProfileChromeScrollView";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInfoSkeleton } from "./ProfileInfoSkeleton";
import { ProfileList } from "./ProfileList";
import { ProfilePicksTabSkeleton } from "./ProfilePicksTabSkeleton";
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
  const { resetChrome } = useProfileChrome();

  const [activeTab, setActiveTab] = useState<ProfileListTabType>(() => {
    return isTabType(params.tab) ? params.tab : "picks";
  });

  const ownProfileTabs: TabItem[] = useMemo(
    () => [
      { id: "picks", label: t("profile.tabs.picks"), icon: Building2 },
      { id: "my-lists", label: t("profile.tabs.myLists"), icon: LayoutGrid },
      { id: "saved", label: t("profile.tabs.saved"), icon: List },
      // { id: "shared-with-me", label: t("profile.tabs.sharedWithMe"), icon: Share2 },
      {
        id: "contributed",
        label: t("profile.tabs.contributed"),
        icon: ListChecks,
      },
    ],
    [t],
  );

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
    ownProfileTabs,
    profile?.show_saved_list,
    profile?.show_contributed_lists,
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
    if (activeTab === "my-lists") {
      if (params.tab === undefined) return;
      router.setParams({ tab: undefined });
      return;
    }
    if (params.tab === activeTab) return;
    router.setParams({ tab: activeTab });
  }, [activeTab, params.tab, router]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (!visibleTabIds.has(tabId)) return;
      setActiveTab(tabId as ProfileListTabType);
    },
    [visibleTabIds],
  );

  const profileUserId = profile?.id ?? userId ?? "";

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
          />
        ),
      })),
    [isOwnProfile, profileUserId, tabs],
  );

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
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

      {isPending ? (
        <ProfileChromeScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="p-4"
        >
          <ProfilePicksTabSkeleton />
        </ProfileChromeScrollView>
      ) : isError || !profile ? (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
            Failed to load profile.
          </Text>
        </View>
      ) : (
        <>
          <View className="pt-4 px-4">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              className="border-b-0"
            />
          </View>
          <View className="flex-1">
            <SectionPager
              pages={pages}
              activeId={activeTab}
              onActiveIdChange={handleTabChange}
            />
          </View>
        </>
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
