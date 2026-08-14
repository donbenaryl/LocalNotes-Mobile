import { useState } from "react";
import { View } from "react-native";
import { ProfileTabPanel, type ProfileListTabType } from "./ProfileTabPanel";

interface ProfileListProps {
  userId: string;
  isOwnProfile?: boolean;
  tab: ProfileListTabType;
}

export function ProfileList({
  userId,
  isOwnProfile = true,
  tab,
}: ProfileListProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Published");
  const [selectedSort, setSelectedSort] = useState("Top Engaged List");
  const [pickFavoriteFilter, setPickFavoriteFilter] = useState("All");

  const statusOpts = ["Published", "Draft"];
  const sortOptions = ["Top Engaged List"];
  const favoriteOptions = ["All", "Favorites only"];

  return (
    <View className="pb-10 pt-4">
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
      />
    </View>
  );
}
