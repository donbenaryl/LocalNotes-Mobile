import { View } from "react-native";
import { ProfilePickSkeletonCard } from "./ProfilePickSkeletonCard";

export function ProfilePicksTabSkeleton() {
  return (
    <View className="gap-4">
      <ProfilePickSkeletonCard />
      <ProfilePickSkeletonCard />
      <ProfilePickSkeletonCard />
    </View>
  );
}
