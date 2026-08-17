import { useState } from "react";
import { View } from "react-native";
import type { BusinessAuthorship } from "@/hooks/useProfileList";
import { ProfileTabPanel, type ProfileListTabType } from "./ProfileTabPanel";

interface ProfileListProps {
  userId: string;
  isOwnProfile?: boolean;
  tab: ProfileListTabType;
  isBusinessProfile?: boolean;
  businessId?: string;
  businessName?: string;
}

export function ProfileList({
  userId,
  isOwnProfile = true,
  tab,
  isBusinessProfile = false,
  businessId,
  businessName,
}: ProfileListProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Published");
  const [selectedSort, setSelectedSort] = useState("Top Engaged List");
  const [pickFavoriteFilter, setPickFavoriteFilter] = useState("All");
  const [businessAuthorship, setBusinessAuthorship] =
    useState<BusinessAuthorship>("about");

  const statusOpts = ["Published", "Draft"];
  const sortOptions = ["Top Engaged List"];
  const favoriteOptions = ["All", "Favorites only"];

  return (
    <View className="pt-4">
      <ProfileTabPanel
        tab={tab}
        userId={userId}
        isOwnProfile={isOwnProfile}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        pickFavoriteFilter={pickFavoriteFilter}
        onPickFavoriteFilterChange={setPickFavoriteFilter}
        statusOptions={statusOpts}
        sortOptions={sortOptions}
        favoriteOptions={favoriteOptions}
        isBusinessProfile={isBusinessProfile}
        businessId={businessId}
        businessName={businessName}
        businessAuthorship={businessAuthorship}
        onBusinessAuthorshipChange={setBusinessAuthorship}
      />
    </View>
  );
}
