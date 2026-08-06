import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { SmartPickTab } from "@/components/PageComponents/SmartPick/SmartPickTab";
import {
  SectionPager,
  type SectionPagerPage,
} from "@/components/ui/SectionPager";
import { getAdjacentSection, SMART_PICK } from "@/constants/swipeNavigation";

export default function SmartPickIndexScreen() {
  const pages: SectionPagerPage[] = useMemo(
    () => [
      {
        id: "smart-pick",
        href: SMART_PICK,
        render: () => <SmartPickTab />,
      },
    ],
    [],
  );

  const handleActiveIdChange = useCallback((_id: string) => {
    // Single-page section — active id never changes.
  }, []);

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <SectionPager
        pages={pages}
        activeId="smart-pick"
        onActiveIdChange={handleActiveIdChange}
        edgeLeftSection={getAdjacentSection("smart-pick", "left")}
        edgeRightSection={getAdjacentSection("smart-pick", "right")}
      />
    </View>
  );
}
