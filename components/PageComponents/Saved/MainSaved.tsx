import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Slot, usePathname, useRouter, type Href } from "expo-router";
import { Inbox, Bookmark, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  HomeTabsChromeProvider,
  useHomeTabsChrome,
} from "@/components/ui/HomeTabsChromeProvider";

interface SavedTabItem extends TabItem {
  href: Href;
}

function getActiveTab(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (segment === "shared-with-me") return "shared-with-me";
  if (segment === "saved") return "saved";
  return "draft";
}

function MainSavedContent({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) {
  const { hideProgress, resetChrome, tabs } = useHomeTabsChrome();

  useEffect(() => {
    resetChrome();
    return () => resetChrome();
  }, [activeTab, resetChrome]);

  const stickyOverlayAnimatedStyle = useAnimatedStyle(() => {
    const progress = hideProgress.value;
    return {
      opacity: progress,
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

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <View className="flex-1">
        <Slot />
      </View>

      <Animated.View
        className="absolute left-0 right-0 top-0 z-10 bg-white/95 dark:bg-gray-900/95"
        style={stickyOverlayAnimatedStyle}
      >
        <View className="pt-2 px-4 mb-2">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="border-b-0"
          />
        </View>
      </Animated.View>
    </View>
  );
}

export default function MainSaved() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);

  const tabs: SavedTabItem[] = useMemo(
    () => [
      {
        id: "draft",
        label: t("saved.tabs.drafts"),
        icon: Inbox,
        href: "/(app)/(tabs)/saved/draft",
      },
      {
        id: "saved",
        label: t("saved.tabs.saved"),
        icon: Bookmark,
        href: "/(app)/(tabs)/saved/saved",
      },
      {
        id: "shared-with-me",
        label: t("saved.tabs.sharedWithMe"),
        icon: Users,
        href: "/(app)/(tabs)/saved/shared-with-me",
      },
    ],
    [t],
  );

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((tb) => tb.id === tabId);
    if (tab && tab.id !== activeTab) {
      router.replace(tab.href);
    }
  };

  return (
    <HomeTabsChromeProvider
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <MainSavedContent activeTab={activeTab} onTabChange={handleTabChange} />
    </HomeTabsChromeProvider>
  );
}
