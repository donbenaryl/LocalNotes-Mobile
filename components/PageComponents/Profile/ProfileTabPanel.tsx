import { ProfileActivityTab } from "./ProfileActivityTab";
import { ProfileListTabPanel } from "./ProfileListTabPanel";
import { ProfilePicksTab } from "./ProfilePicksTab";
import { ComingSoon } from "@/components/ui/ComingSoon";
import type { ProfileTabCategory } from "@/hooks/useProfileList";

export type ProfileListTabType =
  | "my-lists"
  | "saved"
  | "collaborative"
  | "contributed"
  | "recent"
  | "shared-with-me"
  | "picks";

interface ProfileTabPanelProps {
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

export function ProfileTabPanel({
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
}: ProfileTabPanelProps) {
  if (tab === "picks") {
    return (
      <ProfilePicksTab
        userId={userId}
        isOwnProfile={isOwnProfile}
        favoriteFilter={pickFavoriteFilter}
        onFavoriteFilterChange={onPickFavoriteFilterChange}
        favoriteOptions={favoriteOptions}
      />
    );
  }

  if (tab === "recent") {
    return <ProfileActivityTab userId={userId} />;
  }

  if (tab === "contributed") {
    return <ComingSoon />;
  }

  return (
    <ProfileListTabPanel
      tab={tab as ProfileTabCategory}
      userId={userId}
      isOwnProfile={isOwnProfile}
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
  );
}
