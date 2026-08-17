import type { BusinessAuthorship, ProfileTabCategory } from "@/hooks/useProfileList";
import { ProfileListTabContent } from "./ProfileListTabContent";
import { ProfileBusinessAuthorshipToggle } from "./ProfileBusinessAuthorshipToggle";
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
  isBusinessProfile?: boolean;
  businessId?: string;
  businessName?: string;
  businessAuthorship?: BusinessAuthorship;
  onBusinessAuthorshipChange?: (value: BusinessAuthorship) => void;
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
  isBusinessProfile = false,
  businessId,
  businessName,
  businessAuthorship = "about",
  onBusinessAuthorshipChange,
}: ProfileListTabPanelProps) {
  const showBusinessToggle =
    tab === "my-lists" &&
    isBusinessProfile &&
    Boolean(businessId) &&
    Boolean(businessName);

  return (
    <View className="px-4">
      {showBusinessToggle && businessName && onBusinessAuthorshipChange ? (
        <ProfileBusinessAuthorshipToggle
          businessName={businessName}
          value={businessAuthorship}
          onChange={onBusinessAuthorshipChange}
        />
      ) : null}

      <ProfileTabFilters
        tab={tab}
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
        businessAuthorship={showBusinessToggle ? businessAuthorship : "by"}
        businessId={showBusinessToggle ? businessId : undefined}
      />
      <ProfileListTabContent
        category={tab}
        userId={userId}
        isOwnProfile={isOwnProfile}
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        businessAuthorship={showBusinessToggle ? businessAuthorship : "by"}
        businessId={showBusinessToggle ? businessId : undefined}
        businessName={showBusinessToggle ? businessName : undefined}
      />
    </View>
  );
}
