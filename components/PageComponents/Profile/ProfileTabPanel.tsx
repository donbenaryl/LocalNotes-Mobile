import { ProfileListTabPanel } from "./ProfileListTabPanel";
import { ProfilePicksTab } from "./ProfilePicksTab";
import { ProfileAboutTab } from "./ProfileAboutTab";
import { ProfileOffersTab } from "./ProfileOffersTab";
import { ComingSoon } from "@/components/ui/ComingSoon";
import type { BusinessAuthorship, ProfileTabCategory } from "@/hooks/useProfileList";

export type ProfileListTabType =
  | "my-lists"
  | "saved"
  | "offers"
  | "collaborative"
  | "contributed"
  | "shared-with-me"
  | "picks"
  | "about";

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
  isBusinessProfile?: boolean;
  businessId?: string;
  businessName?: string;
  businessAuthorship?: BusinessAuthorship;
  onBusinessAuthorshipChange?: (value: BusinessAuthorship) => void;
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
  isBusinessProfile = false,
  businessId,
  businessName,
  businessAuthorship = "about",
  onBusinessAuthorshipChange,
}: ProfileTabPanelProps) {
  if (tab === "picks") {
    return (
      <ProfilePicksTab
        userId={userId}
        isOwnProfile={isOwnProfile}
        favoriteFilter={pickFavoriteFilter}
        onFavoriteFilterChange={onPickFavoriteFilterChange}
        favoriteOptions={favoriteOptions}
        isBusinessProfile={isBusinessProfile}
        businessId={businessId}
        businessName={businessName}
        businessAuthorship={businessAuthorship}
        onBusinessAuthorshipChange={onBusinessAuthorshipChange}
      />
    );
  }

  if (tab === "contributed") {
    return <ComingSoon />;
  }

  if (tab === "about") {
    return <ProfileAboutTab />;
  }

  if (tab === "offers") {
    if (!businessId) {
      return <ComingSoon />;
    }
    return <ProfileOffersTab businessId={businessId} />;
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
      isBusinessProfile={isBusinessProfile}
      businessId={businessId}
      businessName={businessName}
      businessAuthorship={businessAuthorship}
      onBusinessAuthorshipChange={onBusinessAuthorshipChange}
    />
  );
}
