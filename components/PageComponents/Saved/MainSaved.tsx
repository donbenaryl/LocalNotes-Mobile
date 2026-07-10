import { useEffect } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Slot, usePathname, useRouter, type Href } from "expo-router";
import { Inbox, Bookmark, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useHomeChromeStore } from "@/stores/useHomeChromeStore";

interface SavedTabItem extends TabItem {
  href: Href;
}

function getActiveTab(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (segment === "shared-with-me") return "shared-with-me";
  if (segment === "saved") return "saved";
  return "draft";
}

export default function MainSaved() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);
  // `isScrolled` only drives the frosted styling of the Tabs bar — never its
  // layout position. The bar is a permanent absolute overlay, matching Home,
  // so toggling this can't shift the scroll content (avoids the scroll bounce).
  const isScrolled = useHomeChromeStore((s) => s.isScrolled);
  const setTabsHeight = useHomeChromeStore((s) => s.setTabsHeight);
  const resetChrome = useHomeChromeStore((s) => s.reset);

  const TABS: SavedTabItem[] = [
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
  ];

  useEffect(() => {
    resetChrome();
  }, [activeTab, resetChrome]);

  const handleTabChange = (tabId: string) => {
    const tab = TABS.find((tb) => tb.id === tabId);
    if (tab && tab.id !== activeTab) {
      router.replace(tab.href);
    }
  };

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) setTabsHeight(height);
  };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <View className="flex-1 mt-4">
        <Slot />
      </View>

      {/* Permanent overlay: the scroll content reserves `tabsHeight` of top
          padding (HomeChromeScrollView) so content scrolls under the frosted
          bar without the layout ever shifting. */}
      <View
        onLayout={handleTabsLayout}
        className={`absolute left-0 right-0 top-0 z-10 ${
          isScrolled
            ? "bg-white/70 dark:bg-gray-900/80 backdrop-blur-md"
            : "bg-page dark:bg-gray-900"
        }`}
      >
        <Tabs
          className={isScrolled ? "border-b-0 pt-2" : undefined}
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          textClassName={isScrolled ? "text-gray-900 dark:text-gray-100" : undefined}
        />
      </View>
    </View>
  );
}
