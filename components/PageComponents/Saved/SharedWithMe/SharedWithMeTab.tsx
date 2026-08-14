import { useCallback } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react-native";
import { useRegisterSectionPullToRefresh } from "@/components/ui/SectionPullToRefreshContext";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { useProfile } from "@/hooks/useProfileList";
import { SavedSectionState } from "@/components/PageComponents/Saved/SavedSectionState";

export function SharedWithMeTab() {
  const { t } = useTranslation();

  const {
    list: collaborativeLists,
    isPending: collabPending,
    isError: collabError,
    isRefetching: collabRefetching,
    refetch: refetchCollab,
  } = useProfile({ category: "collaborative", dto: { status: "" } });

  const {
    list: sharedLists,
    isPending: sharedPending,
    isError: sharedError,
    isRefetching: sharedRefetching,
    refetch: refetchShared,
  } = useProfile({ category: "shared-with-me", dto: { status: "" } });

  const isFullyEmpty =
    !collabPending &&
    !sharedPending &&
    !collabError &&
    !sharedError &&
    collaborativeLists.length === 0 &&
    sharedLists.length === 0;

  const isRefetching = sharedRefetching || collabRefetching;
  const handleRefresh = useCallback(() => {
    void Promise.all([refetchShared(), refetchCollab()]);
  }, [refetchShared, refetchCollab]);

  useRegisterSectionPullToRefresh("shared-with-me", handleRefresh, isRefetching);

  return (
    <View className="px-4">
      {isFullyEmpty ? (
        <EmptyScreen
          icon={<Users size={40} color="#D1D5DB" />}
          title={t("saved.sharedWithMe.emptyTitle")}
          description={t("saved.sharedWithMe.emptyDescription")}
          className="py-16"
        />
      ) : (
        <SavedSectionState
          isPending={sharedPending}
          isError={sharedError}
          isEmpty={sharedLists.length === 0}
          onRetry={() => void refetchShared()}
          emptyTitle={t("saved.sharedWithMe.emptyTitle")}
        >
          <View className="gap-4">
            {sharedLists.map((item) => (
              <ListCardDetailed key={item.id} list={item} />
            ))}
          </View>
        </SavedSectionState>
      )}
    </View>
  );
}
