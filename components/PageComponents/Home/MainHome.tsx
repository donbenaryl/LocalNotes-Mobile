import { useEffect } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Slot, usePathname, useRouter, type Href } from "expo-router";
import { Home, Users, Star, Tag } from "lucide-react-native";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useHomeChromeStore } from "@/stores/useHomeChromeStore";

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

export default function MainHome() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);
  const isScrolled = useHomeChromeStore((s) => s.isScrolled);
  const resetChrome = useHomeChromeStore((s) => s.reset);

  useEffect(() => {
    resetChrome();
  }, [activeTab, resetChrome]);

  const handleTabChange = (tabId: string) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (tab && tab.id !== activeTab) {
      router.replace(tab.href);
    }
  };

  return (
    <View
      className="flex-1 bg-page dark:bg-gray-900 -mt-6"
      style={{ paddingTop: insets.top }}
    >
      <View
        className={isScrolled ? "absolute left-0 right-0 z-10 bg-white/70 dark:bg-gray-900/80 backdrop-blur-md" : undefined}
        style={isScrolled ? { paddingTop: insets.top + 18 } : undefined}
      >
        <Tabs
          className={isScrolled ? "border-b-0" : undefined}
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          textClassName={isScrolled ? "text-gray-900 dark:text-gray-100" : undefined}
        />
      </View>

      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
