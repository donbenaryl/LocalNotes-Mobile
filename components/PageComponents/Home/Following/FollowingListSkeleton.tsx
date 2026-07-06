import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

function FollowingCreatorsRowSkeleton() {
  return (
    <View className="mb-8 p-4">
      <Skeleton className="mb-4 h-4 w-32 rounded-lg" />
      <View className="flex-row gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} className="items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-2.5 w-12 rounded-lg" />
          </View>
        ))}
      </View>
    </View>
  );
}

function FollowingActivityCardSkeleton() {
  return (
    <WhiteBox className="gap-3 p-4">
      <View className="flex-row items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-2/5 rounded-lg" />
            <Skeleton className="h-3 w-10 rounded-lg" />
          </View>
          <Skeleton className="h-3 w-4/5 rounded-lg" />
        </View>
      </View>

      <View className="flex-row items-center gap-3 rounded-2xl bg-soft p-3 dark:bg-gray-800/60">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <View className="min-w-0 flex-1 gap-2">
          <Skeleton className="h-3.5 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </View>
      </View>
    </WhiteBox>
  );
}

interface FollowingListSkeletonProps {
  count?: number;
  showCreatorsRow?: boolean;
}

export function FollowingListSkeleton({
  count = 4,
  showCreatorsRow = false,
}: FollowingListSkeletonProps) {
  return (
    <View>
      {showCreatorsRow && <FollowingCreatorsRowSkeleton />}
      <View className="gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <FollowingActivityCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
}

export { FollowingCreatorsRowSkeleton };
