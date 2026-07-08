import { ListFilters } from "@/components/ui/ListFilters";
import { useCategories } from "@/hooks/useProfileList";
import type { ProfileListTabType } from "./ProfileTabPanel";

interface ProfileTabFiltersProps {
  tab: ProfileListTabType;
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
  const { categories } = useCategories();
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  if (tab === "recent") {
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
