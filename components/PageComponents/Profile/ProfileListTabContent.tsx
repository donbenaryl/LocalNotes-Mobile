import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { FolderOpen } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { useProfile, type ProfileTabCategory } from "@/hooks/useProfileList";
import { useRegisterProfilePullToRefresh } from "./ProfilePullToRefreshContext";

interface ProfileListTabContentProps {
  category: ProfileTabCategory;
  userId: string;
  isOwnProfile?: boolean;
  selectedCategory: string;
  selectedStatus: string;
}

export function ProfileListTabContent({
  category,
  userId,
  isOwnProfile = true,
  selectedCategory,
  selectedStatus,
}: ProfileListTabContentProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { list, isPending, isError, isRefetching, refetch } = useProfile({
    category,
    dto: { status: selectedStatus },
    selectedCategory,
    viewedUserId: isOwnProfile ? undefined : userId,
    isOwnProfile,
  });

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  useRegisterProfilePullToRefresh(handleRefresh, isRefetching);

  const sortedList = useMemo(
    () =>
      [...list].sort((a, b) => {
        const getRank = (item: (typeof list)[number]) => {
          const hasCover = Boolean(item.image_url);
          const hasItemImages =
            item.items?.some((i) => (i.images?.length ?? 0) > 0) ?? false;
          if (hasCover && hasItemImages) return 0;
          if (hasCover) return 1;
          if (hasItemImages) return 2;
          return 3;
        };

        return getRank(a) - getRank(b);
      }),
    [list],
  );

  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedListId((prev) =>
      prev && sortedList.some((l) => l.id === prev)
        ? prev
        : (sortedList[0]?.id ?? null),
    );
  }, [sortedList]);

  const handleListDeleted = () => {
    void queryClient.invalidateQueries({ queryKey: ["profile-lists"] });
    void queryClient.invalidateQueries({ queryKey: ["profile-other-lists"] });
  };

  if (isPending) {
    return (
      <View className="items-center justify-center gap-3 py-12">
        <ActivityIndicator size="large" color="#FF6B1A" />
        <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
          {t("profile.lists.loading")}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center justify-center gap-4 py-12">
        <Text className="font-geist text-sm text-red-500">
          {t("profile.lists.error")}
        </Text>
        <LocalNotesButton
          label={t("profile.lists.retry")}
          onPress={() => void refetch()}
          variant="dark"
          size="sm"
          isWidthFull={false}
        />
      </View>
    );
  }

  if (list.length === 0) {
    return (
      <View className="items-center justify-center gap-3 py-16">
        <FolderOpen size={48} color="#D1D5DB" />
        <Text className="font-geist-medium text-base text-gray-500 dark:text-gray-400">
          {t("profile.lists.emptyTitle")}
        </Text>
        <Text className="font-geist text-center text-sm text-gray-400 dark:text-gray-500">
          {category === "my-lists"
            ? t("profile.lists.emptyDescription")
            : t("profile.lists.emptyCategory", { category })}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {sortedList.map((item) => (
        <ListCardDetailed
          key={item.id}
          list={item}
          onDeleted={handleListDeleted}
          collapsible
          expanded={expandedListId === item.id}
          onExpand={() => setExpandedListId(item.id)}
          onCollapse={() => setExpandedListId(null)}
        />
      ))}
    </View>
  );
}
