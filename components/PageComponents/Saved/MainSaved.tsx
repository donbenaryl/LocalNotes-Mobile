import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { usePathname, type Href } from "expo-router";
import { Inbox, Bookmark, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
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
import { DraftsTab } from "@/components/PageComponents/Saved/Drafts/DraftsTab";
import { SavedTab } from "@/components/PageComponents/Saved/Saved/SavedTab";
import { SharedWithMeTab } from "@/components/PageComponents/Saved/SharedWithMe/SharedWithMeTab";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";

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
  tabs,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: SavedTabItem[];
}) {
  const { resetChrome } = useHomeTabsChrome();

  useEffect(() => {
    resetChrome();
    return () => resetChrome();
  }, [activeTab, resetChrome]);

  const pages: SectionPagerPage[] = useMemo(
    () => [
      { id: "draft", href: tabs[0].href, render: () => <DraftsTab /> },
      { id: "saved", href: tabs[1].href, render: () => <SavedTab /> },
      {
        id: "shared-with-me",
        href: tabs[2].href,
        render: () => <SharedWithMeTab />,
      },
    ],
    [tabs],
  );

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <SectionPager
        sectionId="saved"
        chrome={
          <View className="px-4">
            <GuardedHeader />
            <View className="pt-2 mb-2">
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

export default function MainSaved() {
  const { t } = useTranslation();
  const pathname = usePathname();
  // Local state, not the router — see MainHome for why navigating per tab
  // produces a second slide-in on top of the pager's own animation.
  const [activeTab, setActiveTab] = useState(() => getActiveTab(pathname));

  // Explicit sub-routes only — bare draft entry must not reset local pager state
  // when returning from a stack screen.
  useEffect(() => {
    if (!pathname.includes("/saved")) return;
    const tab = getActiveTab(pathname);
    if (tab === "draft") return;
    setActiveTab(tab);
  }, [pathname]);

  // Re-tapping the active footer tab resets to the first sub-tab — see MainHome.
  const resetToken = useSectionRouteStore(
    (s) => s.sectionResetTokens.saved ?? 0,
  );
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setActiveTab("draft");
  }, [resetToken]);

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

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return (
    <HomeTabsChromeProvider tabs={tabs}>
      <MainSavedContent
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />
    </HomeTabsChromeProvider>
  );
}
