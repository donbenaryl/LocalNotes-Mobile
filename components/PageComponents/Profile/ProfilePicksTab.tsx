import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { LayoutGrid, List, Package } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/utils/cn";
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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
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

  return (
    <>
      <View className="px-4 pt-4">
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
          <View className="flex-row items-center justify-between mb-2 -mt-4">
            <Text className="text-sm text-gray-500 dark:text-gray-400 pt-3">
              {t("profile.picks.picksCount", { count: picks.length })}
            </Text>
            <Toggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "list", icon: List },
                { value: "grid", icon: LayoutGrid },
              ]}
            />
          </View>
        )}
      </View>

      <View className={`${viewMode === "grid" ? "px-4" : ""}`}>
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
          <View
            className={cn(
              viewMode === "grid"
                ? "flex-row flex-wrap justify-between gap-y-4"
                : "gap-0",
            )}
          >
            {sortedPicks.map((pick) => (
              <View
                key={pick.id}
                className={viewMode === "grid" ? "w-[48%]" : "w-full"}
              >
                <PickCard
                  data={pick}
                  onRefresh={() => void refetch()}
                  variant={viewMode}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}
