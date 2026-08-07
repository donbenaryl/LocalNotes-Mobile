import { useCallback, useState } from "react";
import { View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileChromeScrollView } from "@/components/ui/ProfileChromeScrollView";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ProfileTabPanel, type ProfileListTabType } from "./ProfileTabPanel";
import {
  ProfilePullToRefreshProvider,
  useProfilePullToRefresh,
} from "./ProfilePullToRefreshContext";

interface ProfileListProps {
  userId: string;
  isOwnProfile?: boolean;
  tab: ProfileListTabType;
}

function ProfileListScroll({
  userId,
  isOwnProfile = true,
  tab,
}: ProfileListProps) {
  const queryClient = useQueryClient();
  const { handler } = useProfilePullToRefresh();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Published");
  const [selectedSort, setSelectedSort] = useState("Top Engaged List");
  const [pickFavoriteFilter, setPickFavoriteFilter] = useState("All");

  const statusOpts = ["Published", "Draft"];
  const sortOptions = ["Top Engaged List"];
  const favoriteOptions = ["All", "Favorites only"];

  const handleRefresh = useCallback(() => {
    handler?.onRefresh();
    void queryClient.invalidateQueries({
      queryKey: isOwnProfile ? ["profile"] : ["profile", userId],
    });
  }, [handler, queryClient, isOwnProfile, userId]);

  return (
    <View className="flex-1">
      <ProfileChromeScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <AppRefreshControl
            refreshing={handler?.refreshing ?? false}
            onRefresh={handleRefresh}
          />
        }
      >
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
      </ProfileChromeScrollView>
    </View>
  );
}

export function ProfileList({
  userId,
  isOwnProfile = true,
  tab,
}: ProfileListProps) {
  return (
    <ProfilePullToRefreshProvider>
      <ProfileListScroll
        userId={userId}
        isOwnProfile={isOwnProfile}
        tab={tab}
      />
    </ProfilePullToRefreshProvider>
  );
}
