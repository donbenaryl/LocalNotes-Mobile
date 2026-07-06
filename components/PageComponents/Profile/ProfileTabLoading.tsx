import { ProfileListTabSkeleton } from "./ProfileListTabSkeleton";
import { ProfilePicksTabSkeleton } from "./ProfilePicksTabSkeleton";
import { ProfileTabFilters } from "./ProfileTabFilters";
import type { ProfileListTabType } from "./ProfileTabPanel";

interface ProfileTabLoadingProps {
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

export function ProfileTabLoading({
  tab,
  ...filterProps
}: ProfileTabLoadingProps) {
  return (
    <>
      <ProfileTabFilters tab={tab} {...filterProps} />
      {tab === "picks" ? <ProfilePicksTabSkeleton /> : <ProfileListTabSkeleton />}
    </>
  );
}
