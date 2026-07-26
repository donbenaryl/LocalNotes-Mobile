import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Package } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useProfilePicks } from "@/hooks/useProfileList";
import { PickCard } from "./PickCard";
import { ProfilePicksTabSkeleton } from "./ProfilePicksTabSkeleton";
import { ProfileTabFilters } from "./ProfileTabFilters";

interface ProfilePicksTabProps {
  userId: string;
  isOwnProfile?: boolean;
  favoriteFilter: string;
  onFavoriteFilterChange: (value: string) => void;
  favoriteOptions: string[];
}

export function ProfilePicksTab({
  userId,
  isOwnProfile = true,
  favoriteFilter,
  onFavoriteFilterChange,
  favoriteOptions,
}: ProfilePicksTabProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const viewedUserId = isOwnProfile ? undefined : userId;
  const { picks, isPending, refetch } = useProfilePicks(
    favoriteFilter,
    true,
    viewedUserId,
    selectedCategory === "All" ? [] : [selectedCategory],
  );

  const sortedPicks = useMemo(
    () =>
      [...picks].sort((a, b) => {
        const aHas = (a.images?.length ?? 0) > 0;
        const bHas = (b.images?.length ?? 0) > 0;
        if (aHas === bHas) return 0;
        return aHas ? -1 : 1;
      }),
    [picks],
  );

  const { leftColumn, rightColumn } = useMemo(() => {
    const left = sortedPicks.filter((_, index) => index % 2 === 0);
    const right = sortedPicks.filter((_, index) => index % 2 === 1);
    return { leftColumn: left, rightColumn: right };
  }, [sortedPicks]);

  return (
    <>
      <View className="px-4">
        <ProfileTabFilters
          tab="picks"
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus=""
          onStatusChange={() => {}}
          selectedSort=""
          onSortChange={() => {}}
          pickFavoriteFilter={favoriteFilter}
          onPickFavoriteFilterChange={onFavoriteFilterChange}
          statusOptions={[]}
          sortOptions={[]}
          favoriteOptions={favoriteOptions}
        />

        {!isPending && picks.length > 0 && (
          <View className="mb-2 -mt-4">
            <Text className="text-sm text-gray-500 dark:text-gray-400 pt-3">
              {t("profile.picks.picksCount", { count: picks.length })}
            </Text>
          </View>
        )}
      </View>

      <View className="px-4">
        {isPending ? (
          <ProfilePicksTabSkeleton />
        ) : picks.length === 0 ? (
          <View className="items-center justify-center gap-3 py-16">
            <Package size={48} color="#D1D5DB" />
            <Text className="font-geist-medium text-base text-gray-500 dark:text-gray-400">
              {t("profile.picks.emptyTitle")}
            </Text>
            <Text className="text-center font-geist text-sm text-gray-400 dark:text-gray-500">
              {t("profile.picks.emptyDescription")}
            </Text>
          </View>
        ) : (
          <View className="flex-row gap-3">
            <View className="flex-1 gap-3">
              {leftColumn.map((pick) => (
                <PickCard
                  key={pick.id}
                  data={pick}
                  onRefresh={() => void refetch()}
                />
              ))}
            </View>
            <View className="flex-1 gap-3">
              {rightColumn.map((pick) => (
                <PickCard
                  key={pick.id}
                  data={pick}
                  onRefresh={() => void refetch()}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </>
  );
}
