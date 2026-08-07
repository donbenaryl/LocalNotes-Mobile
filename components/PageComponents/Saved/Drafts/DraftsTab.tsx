import { useCallback } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react-native";
import { HomeTabsChromeScrollView } from "@/components/ui/HomeTabsChromeScrollView";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { PageSectionTitle } from "@/components/ui/PageSectionTitle";
import { useProfile } from "@/hooks/useProfileList";
import { SavedSectionState } from "@/components/PageComponents/Saved/SavedSectionState";
import { DraftsSmartSuggestion } from "./DraftsSmartSuggestion";
import { DraftsPickCaptures } from "./DraftsPickCaptures";
import { DraftsProfileLink } from "./DraftsProfileLink";

export function DraftsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { list, isPending, isError, isRefetching, refetch } = useProfile({
    category: "my-lists",
    dto: { status: "Draft" },
  });

  const handleListDeleted = () => {
    void queryClient.invalidateQueries({ queryKey: ["profile-lists"] });
  };

  const handleRefresh = useCallback(() => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ["profile-picks"] });
  }, [refetch, queryClient]);

  return (
    <HomeTabsChromeScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <AppRefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
        />
      }
    >
      <DraftsSmartSuggestion />

      <PageSectionTitle className="mb-3">
        {t("saved.drafts.listDraftsHeading")}
      </PageSectionTitle>

      <View className="mb-6">
        <SavedSectionState
          isPending={isPending}
          isError={isError}
          isEmpty={list.length === 0}
          onRetry={() => void refetch()}
          emptyIcon={<FolderOpen size={40} color="#D1D5DB" />}
          emptyTitle={t("saved.drafts.emptyTitle")}
          emptyDescription={t("saved.drafts.emptyDescription")}
        >
          <View className="gap-4">
            {list.map((item) => (
              <ListCardDetailed
                key={item.id}
                list={item}
                onDeleted={handleListDeleted}
              />
            ))}
          </View>
        </SavedSectionState>
      </View>

      <PageSectionTitle className="mb-3">
        {t("saved.drafts.pickCapturesHeading")}
      </PageSectionTitle>
      <DraftsPickCaptures />

      <DraftsProfileLink />
    </HomeTabsChromeScrollView>
  );
}
