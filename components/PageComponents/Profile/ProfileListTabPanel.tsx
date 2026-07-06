import type { ProfileTabCategory } from "@/hooks/useProfileList";
import { ProfileListTabContent } from "./ProfileListTabContent";
import { ProfileTabFilters } from "./ProfileTabFilters";
import { View } from "react-native";

interface ProfileListTabPanelProps {
  tab: ProfileTabCategory;
  userId: string;
  isOwnProfile?: boolean;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedSort: string;
  onSortChange: (value: string) => void;
  pickFavoriteFilter: string;
  onPickFavoriteFilterChange: (value: string) => void;
  statusOptions: string[];
  sortOptions: string[];
  favoriteOptions: string[];
}

export function ProfileListTabPanel({
  tab,
  userId,
  isOwnProfile = true,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedSort,
  onSortChange,
  pickFavoriteFilter,
  onPickFavoriteFilterChange,
  statusOptions,
  sortOptions,
  favoriteOptions,
}: ProfileListTabPanelProps) {
  return (
    <View className="p-4">
      <ProfileTabFilters
        tab={tab}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        selectedSort={selectedSort}
        onSortChange={onSortChange}
        pickFavoriteFilter={pickFavoriteFilter}
        onPickFavoriteFilterChange={onPickFavoriteFilterChange}
        statusOptions={statusOptions}
        sortOptions={sortOptions}
        favoriteOptions={favoriteOptions}
      />
      <ProfileListTabContent
        category={tab}
        userId={userId}
        isOwnProfile={isOwnProfile}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
      />
    </View>
  );
}
