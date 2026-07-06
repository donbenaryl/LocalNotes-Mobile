import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileInfoSkeleton() {
  return (
    <View className="px-6 pt-5 pb-4 gap-4">
      <View className="flex-row items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
        </View>
      </View>

      <View className="gap-2">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
      </View>

      <View className="flex-row gap-5">
        <Skeleton className="h-5 w-16 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-lg" />
      </View>

      <View className="flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
      </View>
    </View>
  );
}
