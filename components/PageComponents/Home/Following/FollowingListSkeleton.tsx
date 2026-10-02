import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";

function FollowingActivityCardSkeleton({ showDivider }: { showDivider: boolean }) {
  return (
    <View
      className={cn("gap-3 py-4", showDivider && "border-b border-gray-100 dark:border-gray-800")}
    >
      <View className="flex-row items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <View className="min-w-0 flex-1 gap-2 pt-0.5">
          <Skeleton className="h-3.5 w-3/5 rounded-lg" />
          <Skeleton className="h-3 w-2/5 rounded-lg" />
        </View>
        <Skeleton className="h-5 w-5 rounded-md" />
      </View>

      <View className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <Skeleton className="h-28 w-full rounded-none" />
        <View className="m-2.5 flex-row items-center gap-3 rounded-xl border border-gray-200 p-2.5 dark:border-gray-700">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <View className="min-w-0 flex-1 gap-2">
            <Skeleton className="h-3.5 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
          </View>
        </View>
        <View className="flex-row items-center justify-between px-3 pb-3">
          <Skeleton className="h-3 w-14 rounded-lg" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </View>
      </View>
    </View>
  );
}

interface FollowingListSkeletonProps {
  count?: number;
}

export function FollowingListSkeleton({ count = 3 }: FollowingListSkeletonProps) {
  return (
    <View>
      <Skeleton className="h-3 w-24 rounded-lg" />
      {Array.from({ length: count }).map((_, index) => (
        <FollowingActivityCardSkeleton key={index} showDivider={index < count - 1} />
      ))}
    </View>
  );
}
