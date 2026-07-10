import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react-native";
import { HomeChromeScrollView } from "@/components/ui/HomeChromeScrollView";
import { ListCard } from "@/components/ui/ListCard";
import { PageSectionTitle } from "@/components/ui/PageSectionTitle";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { useProfile } from "@/hooks/useProfileList";
import { SavedSectionState } from "@/components/PageComponents/Saved/SavedSectionState";

export function SharedWithMeTab() {
  const { t } = useTranslation();

  const {
    list: collaborativeLists,
    isPending: collabPending,
    isError: collabError,
    refetch: refetchCollab,
  } = useProfile({ category: "collaborative", dto: { status: "" } });

  const {
    list: sharedLists,
    isPending: sharedPending,
    isError: sharedError,
    refetch: refetchShared,
  } = useProfile({ category: "shared-with-me", dto: { status: "" } });

  const isFullyEmpty =
    !collabPending &&
    !sharedPending &&
    !collabError &&
    !sharedError &&
    collaborativeLists.length === 0 &&
    sharedLists.length === 0;

  if (isFullyEmpty) {
    return (
      <View className="flex-1 px-4 pt-4">
        <EmptyScreen
          icon={<Users size={40} color="#D1D5DB" />}
          title={t("saved.sharedWithMe.emptyTitle")}
          description={t("saved.sharedWithMe.emptyDescription")}
          className="py-16"
        />
      </View>
    );
  }

  return (
    <HomeChromeScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
      showsVerticalScrollIndicator={false}
    >
      <SavedSectionState
        isPending={sharedPending}
        isError={sharedError}
        isEmpty={sharedLists.length === 0}
        onRetry={() => void refetchShared()}
        emptyTitle={t("saved.sharedWithMe.emptyTitle")}
      >
        <View className="gap-4">
          {sharedLists.map((item) => (
            <ListCard key={item.id} data={item} />
          ))}
        </View>
      </SavedSectionState>
    </HomeChromeScrollView>
  );
}
