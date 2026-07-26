import { View } from "react-native";
import { ProfilePickSkeletonCard } from "./ProfilePickSkeletonCard";

export function ProfilePicksTabSkeleton() {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1 gap-3">
        <ProfilePickSkeletonCard />
        <ProfilePickSkeletonCard />
        <ProfilePickSkeletonCard />
      </View>
      <View className="flex-1 gap-3">
        <ProfilePickSkeletonCard />
        <ProfilePickSkeletonCard />
      </View>
    </View>
  );
}
