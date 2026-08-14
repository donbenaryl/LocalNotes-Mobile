import { useEffect } from "react";
import { ListFilters } from "@/components/ui/ListFilters";
import { useTabCategoryOptions, type ProfileTabCategory } from "@/hooks/useProfileList";
import type { ProfileListTabType } from "./ProfileTabPanel";

function toListTab(tab: ProfileListTabType): ProfileTabCategory {
  if (tab === "about") return "my-lists";
  return tab;
}

interface ProfileTabFiltersProps {
  tab: ProfileListTabType;
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

export function ProfileTabFilters({
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
}: ProfileTabFiltersProps) {
  const listTab = toListTab(tab);
  const { categoryOptions } = useTabCategoryOptions({
    tab: listTab,
    userId,
    isOwnProfile,
    selectedStatus,
    favoriteFilter: pickFavoriteFilter,
  });

  useEffect(() => {
    if (
      selectedCategory !== "All" &&
      !categoryOptions.some((c) => c.id === selectedCategory)
    ) {
      onCategoryChange("All");
    }
  }, [selectedCategory, categoryOptions, onCategoryChange]);

  if (tab === "about") {
    return null;
  }

  if (tab === "picks") {
    return (
      <ListFilters
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        categoryOptions={categoryOptions}
        selectedSort=""
        onSortChange={() => {}}
        sortOptions={[]}
        showCategory
        showSort={false}
        showFavorite
        selectedFavorite={pickFavoriteFilter}
        onFavoriteChange={onPickFavoriteFilterChange}
        favoriteOptions={favoriteOptions}
      />
    );
  }

  return (
    <ListFilters
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
      categoryOptions={categoryOptions}
      selectedSort={selectedSort}
      onSortChange={onSortChange}
      sortOptions={sortOptions}
      selectedStatus={selectedStatus}
      onStatusChange={onStatusChange}
      statusOptions={statusOptions}
      showStatus={tab !== "saved"}
    />
  );
}
