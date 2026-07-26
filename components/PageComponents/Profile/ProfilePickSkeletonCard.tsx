import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

export function ProfilePickSkeletonCard() {
  return (
    <WhiteBox className="p-0">
      <Skeleton className="w-full aspect-[16/12] rounded-t-2xl" />
      <View className="gap-1 p-3">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <View className="mt-1 flex-row gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </View>
        <View className="mt-2 flex-row items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700">
          <View className="flex-row items-center gap-1.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </View>
          <Skeleton className="h-3 w-6" />
        </View>
      </View>
    </WhiteBox>
  );
}
