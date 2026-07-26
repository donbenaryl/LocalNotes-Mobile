import { useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Bookmark, Package } from "lucide-react-native";
import { HomeChromeScrollView } from "@/components/ui/HomeChromeScrollView";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { PickCard } from "@/components/PageComponents/Profile/PickCard";
import { useProfile, useProfilePicks } from "@/hooks/useProfileList";
import { SavedSectionState } from "@/components/PageComponents/Saved/SavedSectionState";
import { SavedListsPicksToggle, type SavedSubTab } from "./SavedListsPicksToggle";

export function SavedTab() {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<SavedSubTab>("lists");

  const {
    list: savedLists,
    isPending: listsPending,
    isError: listsError,
    refetch: refetchLists,
  } = useProfile({ category: "saved", dto: { status: "" } });

  const {
    picks: savedPicks,
    isPending: picksPending,
    isError: picksError,
    refetch: refetchPicks,
  } = useProfilePicks("Favorites only", subTab === "picks");

  const { leftColumn, rightColumn } = useMemo(() => {
    const left = savedPicks.filter((_, index) => index % 2 === 0);
    const right = savedPicks.filter((_, index) => index % 2 === 1);
    return { leftColumn: left, rightColumn: right };
  }, [savedPicks]);

  const listsLabel = listsPending
    ? t("saved.saved.listsLabel")
    : `${t("saved.saved.listsLabel")} ${savedLists.length}`;
  const picksLabel = picksPending
    ? t("saved.saved.picksLabel")
    : `${t("saved.saved.picksLabel")} ${savedPicks.length}`;

  return (
    <HomeChromeScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
      showsVerticalScrollIndicator={false}
    >
      <SavedListsPicksToggle
        activeTab={subTab}
        onChange={setSubTab}
        listsLabel={listsLabel}
        picksLabel={picksLabel}
      />

      {subTab === "lists" ? (
        <SavedSectionState
          isPending={listsPending}
          isError={listsError}
          isEmpty={savedLists.length === 0}
          onRetry={() => void refetchLists()}
          emptyIcon={<Bookmark size={40} color="#D1D5DB" />}
          emptyTitle={t("saved.saved.emptyListsTitle")}
          emptyDescription={t("saved.saved.emptyListsDescription")}
        >
          <View className="gap-4">
            {savedLists.map((item) => (
              <ListCardDetailed key={item.id} list={item} />
            ))}
          </View>
        </SavedSectionState>
      ) : (
        <SavedSectionState
          isPending={picksPending}
          isError={picksError}
          isEmpty={savedPicks.length === 0}
          onRetry={() => void refetchPicks()}
          emptyIcon={<Package size={40} color="#D1D5DB" />}
          emptyTitle={t("saved.saved.emptyPicksTitle")}
          emptyDescription={t("saved.saved.emptyPicksDescription")}
        >
          <View className="flex-row gap-3">
            <View className="flex-1 gap-3">
              {leftColumn.map((pick) => (
                <PickCard
                  key={pick.id}
                  data={pick}
                  onRefresh={() => void refetchPicks()}
                />
              ))}
            </View>
            <View className="flex-1 gap-3">
              {rightColumn.map((pick) => (
                <PickCard
                  key={pick.id}
                  data={pick}
                  onRefresh={() => void refetchPicks()}
                />
              ))}
            </View>
          </View>
        </SavedSectionState>
      )}
    </HomeChromeScrollView>
  );
}
