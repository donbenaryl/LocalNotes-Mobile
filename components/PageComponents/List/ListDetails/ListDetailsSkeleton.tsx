import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

/** Compact list-detail placeholder: hero + author + a single pick row. */
export function ListDetailsSkeleton() {
  return (
    <View className="bg-page pb-3 dark:bg-gray-900">
      <View className="mx-3.5 mt-1">
        <Skeleton className="aspect-[16/9] w-full rounded-[18px]" />
        <View className="mt-3 flex-row items-center gap-1.5 px-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 flex-1 rounded-lg" />
        </View>
      </View>

      <View className="mt-3.5 flex-row items-center gap-2.5 px-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <View className="min-w-0 flex-1 gap-1.5">
          <Skeleton className="h-3.5 w-2/5 rounded-lg" />
          <Skeleton className="h-3 w-1/3 rounded-lg" />
        </View>
        <Skeleton className="h-8 w-16 rounded-full" />
      </View>

      <View className="mt-2 border-t border-gray-100 px-4 pt-2 dark:border-gray-800">
        <View className="flex-row items-center gap-3 py-1">
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
          <View className="min-w-0 flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-4/5 rounded-lg" />
          </View>
        </View>
      </View>
    </View>
  );
}
