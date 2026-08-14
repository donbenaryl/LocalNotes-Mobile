import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, type Href } from "expo-router";
import { Home, Users, Star, Tag } from "lucide-react-native";
import { type TabItem } from "@/components/ui/Tabs";
import { type SectionPagerPage } from "@/components/ui/SectionPager";
import { SectionTabsScrollLayout } from "@/components/ui/SectionTabsScrollLayout";
import {
  SectionPullToRefreshProvider,
} from "@/components/ui/SectionPullToRefreshContext";
import { HomeTab } from "@/components/PageComponents/Home/Home/HomeTab";
import { FollowingTab } from "@/components/PageComponents/Home/Following/FollowingTab";
import { SpotlightTab } from "@/components/PageComponents/Home/Spotlight/SpotlightTab";
import { OffersTab } from "@/components/PageComponents/Home/Offers/OffersTab";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";
import { resolveSectionTabFromPathname } from "@/utils/sectionTabSync";

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
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(() => getActiveTab(pathname));

  useEffect(() => {
    const lastHref = useSectionRouteStore.getState().lastHrefBySection.home;
    setActiveTab((current) => {
      const tab = resolveSectionTabFromPathname({
        pathname,
        sectionSegment: "/home",
        defaultTabId: "home",
        getActiveTabFromPathname: getActiveTab,
        lastHref,
        currentActiveTab: current,
      });
      return tab ?? current;
    });
  }, [pathname]);

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
    <SectionPullToRefreshProvider activeTabId={activeTab}>
      <SectionTabsScrollLayout
        sectionId="home"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pages={pages}
      />
    </SectionPullToRefreshProvider>
  );
}
