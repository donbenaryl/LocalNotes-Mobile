import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { usePathname, type Href } from "expo-router";
import { Home, Users, Star, Tag } from "lucide-react-native";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  SectionPager,
  type SectionPagerPage,
} from "@/components/ui/SectionPager";
import {
  HomeTabsChromeProvider,
  useHomeTabsChrome,
} from "@/components/ui/HomeTabsChromeProvider";
import { GuardedHeader } from "@/components/ui/layout/GuardedHeader";
import { HomeTab } from "@/components/PageComponents/Home/Home/HomeTab";
import { FollowingTab } from "@/components/PageComponents/Home/Following/FollowingTab";
import { SpotlightTab } from "@/components/PageComponents/Home/Spotlight/SpotlightTab";
import { OffersTab } from "@/components/PageComponents/Home/Offers/OffersTab";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";

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
  const { resetChrome, tabs } = useHomeTabsChrome();

  useEffect(() => {
    resetChrome();
    return () => resetChrome();
  }, [activeTab, resetChrome]);

  const pages: SectionPagerPage[] = useMemo(
    () => [
      { id: "home", href: TABS[0].href, render: () => <HomeTab /> },
      { id: "following", href: TABS[1].href, render: () => <FollowingTab /> },
      { id: "spotlight", href: TABS[2].href, render: () => <SpotlightTab /> },
      { id: "offers", href: TABS[3].href, render: () => <OffersTab /> },
    ],
    [],
  );

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <SectionPager
        sectionId="home"
        chrome={
          <View className="px-4">
            <GuardedHeader />
            <View className="pt-2 mb-4">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={onTabChange}
                className="border-b-0"
              />
            </View>
          </View>
        }
        pages={pages}
        activeId={activeTab}
        onActiveIdChange={onTabChange}
      />
    </View>
  );
}

export default function MainHome() {
  const pathname = usePathname();
  // Every tab lives in the pager, so the active tab is local state. Navigating
  // per tab would remount this screen through the parent stack — a second,
  // unwanted slide-in on top of the pager's own animation.
  const [activeTab, setActiveTab] = useState(() => getActiveTab(pathname));

  // Inbound only: deep links (e.g. a push to /home/spotlight) still select a tab.
  useEffect(() => {
    if (!pathname.includes("/home")) return;
    setActiveTab(getActiveTab(pathname));
  }, [pathname]);

  // Re-tapping the active footer tab resets to the first sub-tab. It cannot go
  // through the URL — sub-tabs are local state, so the pathname never changes.
  const resetToken = useSectionRouteStore((s) => s.sectionResetTokens.home ?? 0);
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setActiveTab(TABS[0].id);
  }, [resetToken]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return (
    <HomeTabsChromeProvider tabs={TABS}>
      <MainHomeContent activeTab={activeTab} onTabChange={handleTabChange} />
    </HomeTabsChromeProvider>
  );
}
