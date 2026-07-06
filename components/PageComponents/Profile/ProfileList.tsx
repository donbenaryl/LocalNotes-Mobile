import { useDeferredValue, useState } from "react";
import { View } from "react-native";
import { ProfileChromeScrollView } from "@/components/ui/ProfileChromeScrollView";
import { ProfileTabLoading } from "./ProfileTabLoading";
import { ProfileTabPanel, type ProfileListTabType } from "./ProfileTabPanel";

interface ProfileListProps {
  userId: string;
  isOwnProfile?: boolean;
  activeTab: ProfileListTabType;
}

export function ProfileList({
  userId,
  isOwnProfile = true,
  activeTab,
}: ProfileListProps) {
  const deferredTab = useDeferredValue(activeTab);
  const isTabTransitioning = activeTab !== deferredTab;

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Published");
  const [selectedSort, setSelectedSort] = useState("Top Engaged List");
  const [pickFavoriteFilter, setPickFavoriteFilter] = useState("All");

  const statusOpts = ["Published", "Draft", "Archived"];
  const sortOptions = ["Top Engaged List"];
  const favoriteOptions = ["All", "Favorites only"];

  return (
    <View className="flex-1">
      <ProfileChromeScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {isTabTransitioning ? (
          <View className="p-4">
            <ProfileTabLoading
              tab={activeTab}
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
        ) : (
          <ProfileTabPanel
            tab={deferredTab}
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
        )}
      </ProfileChromeScrollView>
    </View>
  );
}
