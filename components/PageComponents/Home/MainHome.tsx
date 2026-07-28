import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Slot, usePathname, useRouter, type Href } from "expo-router";
import { Home, Users, Star, Tag } from "lucide-react-native";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  HomeTabsChromeProvider,
  useHomeTabsChrome,
} from "@/components/ui/HomeTabsChromeProvider";

interface HomeTabItem extends TabItem {
  href: Href;
}

const TABS: HomeTabItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/(app)/(tabs)/home" },
  {
    id: "following",
    label: "Following",
    icon: Users,
    href: "/(app)/(tabs)/home/following",
  },
  {
    id: "spotlight",
    label: "Spotlight",
    icon: Star,
    href: "/(app)/(tabs)/home/spotlight",
  },
  {
    id: "offers",
    label: "Offers",
    icon: Tag,
    href: "/(app)/(tabs)/home/offers",
  },
];

function getActiveTab(pathname: string): string {
  if (pathname.includes("/following")) return "following";
  if (pathname.includes("/spotlight")) return "spotlight";
  if (pathname.includes("/offers")) return "offers";
  return "home";
}

function MainHomeContent({
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
        className="absolute left-0 right-0 top-0 z-10 bg-page/95 dark:bg-gray-900/95"
        style={stickyOverlayAnimatedStyle}
      >
        <View className="pt-2 px-4">
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

export default function MainHome() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);

  const handleTabChange = (tabId: string) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (tab && tab.id !== activeTab) {
      router.replace(tab.href);
    }
  };

  return (
    <HomeTabsChromeProvider
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <MainHomeContent activeTab={activeTab} onTabChange={handleTabChange} />
    </HomeTabsChromeProvider>
  );
}
