import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, type Href } from "expo-router";
import { Inbox, Bookmark, Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { type TabItem } from "@/components/ui/Tabs";
import { type SectionPagerPage } from "@/components/ui/SectionPager";
import { SectionTabsScrollLayout } from "@/components/ui/SectionTabsScrollLayout";
import {
  SectionPullToRefreshProvider,
} from "@/components/ui/SectionPullToRefreshContext";
import { DraftsTab } from "@/components/PageComponents/Saved/Drafts/DraftsTab";
import { SavedTab } from "@/components/PageComponents/Saved/Saved/SavedTab";
import { SharedWithMeTab } from "@/components/PageComponents/Saved/SharedWithMe/SharedWithMeTab";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";
import { resolveSectionTabFromPathname } from "@/utils/sectionTabSync";

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
  const [activeTab, setActiveTab] = useState(() => getActiveTab(pathname));

  useEffect(() => {
    const lastHref = useSectionRouteStore.getState().lastHrefBySection.saved;
    setActiveTab((current) => {
      const tab = resolveSectionTabFromPathname({
        pathname,
        sectionSegment: "/saved",
        defaultTabId: "draft",
        getActiveTabFromPathname: getActiveTab,
        lastHref,
        currentActiveTab: current,
      });
      return tab ?? current;
    });
  }, [pathname]);

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
    <SectionPullToRefreshProvider activeTabId={activeTab}>
      <SectionTabsScrollLayout
        sectionId="saved"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pages={pages}
      />
    </SectionPullToRefreshProvider>
  );
}
