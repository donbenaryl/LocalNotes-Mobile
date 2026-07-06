import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

function HomeFilterSkeleton() {
  return (
    <View className="mb-4">
      <Skeleton className="mb-3.5 h-4 w-48 rounded-lg" />
      <View className="flex-row gap-1.5">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </View>
    </View>
  );
}

function HomeEditorialSkeleton() {
  return (
    <View className="mb-4">
      <Skeleton className="mb-2 h-4 w-48 rounded-lg" />
      <Skeleton className="mb-2 h-7 w-4/5 rounded-lg" />
      <Skeleton className="h-6 w-2/5 rounded-lg" />
    </View>
  );
}

function ForYouRailSkeleton() {
  return (
    <View className="mb-6">
      <View className="mb-2.5 flex-row items-center justify-between">
        <Skeleton className="h-3 w-16 rounded-lg" />
        <Skeleton className="h-3 w-14 rounded-lg" />
      </View>
      <HomeForYouCardSkeleton />
    </View>
  );
}

function HomeForYouCardSkeleton() {
  return (
    <WhiteBox className="p-0">
      <Skeleton className="h-44 w-full rounded-none" />

      <View className="px-4 pt-3">
        <View className="mb-3 flex-row items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-2/5 rounded-lg" />
            <Skeleton className="h-3 w-3/5 rounded-lg" />
          </View>
        </View>

        <Skeleton className="mb-2 h-5 w-4/5 rounded-lg" />
        <Skeleton className="mb-3 h-4 w-full rounded-lg" />

        <View className="border-t border-gray-200 py-3 dark:border-gray-700">
          <View className="flex-row gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-3.5 w-1/2 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <Skeleton className="h-3 w-32 rounded-lg" />
        <Skeleton className="h-3 w-16 rounded-lg" />
      </View>
    </WhiteBox>
  );
}

export function HomeTabSkeleton() {
  return (
    <View>
      <HomeFilterSkeleton />
      <HomeEditorialSkeleton />
      <ForYouRailSkeleton />
    </View>
  );
}
