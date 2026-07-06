import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

function ProfileListSkeletonCard() {
  return (
    <WhiteBox>
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </View>
      </View>

      <Skeleton className="mt-3 h-4 w-4/5" />

      <View className="mt-3 flex-row gap-2">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <Skeleton className="h-16 w-16 rounded-lg" />
        <Skeleton className="h-16 w-16 rounded-lg" />
      </View>

      <View className="mt-4 flex-row gap-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </View>
    </WhiteBox>
  );
}

export function ProfileListTabSkeleton() {
  return (
    <View className="gap-4">
      <ProfileListSkeletonCard />
      <ProfileListSkeletonCard />
      <ProfileListSkeletonCard />
    </View>
  );
}
