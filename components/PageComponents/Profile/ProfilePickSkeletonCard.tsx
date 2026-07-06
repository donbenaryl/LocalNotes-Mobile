import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

export function ProfilePickSkeletonCard() {
  return (
    <WhiteBox className="p-0">
      <View className="min-h-28">
        <Skeleton className="absolute left-0 top-0 bottom-0 w-28 rounded-l-2xl" />
        <Skeleton className="absolute right-3 top-3 h-6 w-6 rounded-md" />

        <View className="gap-1 pl-32 pr-16 pt-4">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <View className="mt-2 flex-row gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </View>
        </View>

        <View className="gap-2 border-t border-gray-200 pb-4 pl-32 pr-4 pt-3 dark:border-gray-700">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-1.5">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </View>
            <Skeleton className="h-3 w-16" />
          </View>
          <Skeleton className="h-3 w-1/2" />
        </View>
      </View>
    </WhiteBox>
  );
}
