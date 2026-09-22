import { useState } from "react";
import { View } from "react-native";
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { BusinessAuthorship } from "@/hooks/useProfileList";
import { ProfileTabPanel, type ProfileListTabType } from "./ProfileTabPanel";

interface ProfileListProps {
  userId: string;
  isOwnProfile?: boolean;
  tab: ProfileListTabType;
  isBusinessProfile?: boolean;
  /** Public `/business/[id]` page. */
  isBusinessPage?: boolean;
  businessId?: string;
  businessName?: string;
  /** When set (public business page), About tab uses this payload instead of the store. */
  business?: BusinessItemDAO | null;
}

export function ProfileList({
  userId,
  isOwnProfile = true,
  tab,
  isBusinessProfile = false,
  isBusinessPage = false,
  businessId,
  businessName,
  business,
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
        selectedStatus={isOwnProfile ? selectedStatus : "Published"}
        onStatusChange={setSelectedStatus}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        pickFavoriteFilter={pickFavoriteFilter}
        onPickFavoriteFilterChange={setPickFavoriteFilter}
        statusOptions={isOwnProfile ? statusOpts : []}
        sortOptions={sortOptions}
        favoriteOptions={favoriteOptions}
        isBusinessProfile={isBusinessProfile}
        isBusinessPage={isBusinessPage}
        businessId={businessId}
        businessName={businessName}
        business={business}
        businessAuthorship={businessAuthorship}
        onBusinessAuthorshipChange={setBusinessAuthorship}
      />
    </View>
  );
}
