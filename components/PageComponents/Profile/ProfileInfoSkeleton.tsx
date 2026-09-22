import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileInfoSkeleton() {
  return (
    <View className="px-4 pb-1 pt-2">
      <View className="flex-row items-center gap-3.5">
        <Skeleton className="h-20 w-20 rounded-full" />
        <View className="min-w-0 flex-1 gap-1.5">
          <Skeleton className="h-7 w-44 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </View>
      </View>

      <Skeleton className="mt-3 h-4 w-full rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-5/6 rounded-lg" />
      <Skeleton className="mt-1.5 h-4 w-2/3 rounded-lg" />
      <Skeleton className="mt-2 h-3.5 w-28 rounded-lg" />

      <View className="mt-4 flex-row rounded-2xl bg-white py-3 dark:bg-gray-800">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            className={`flex-1 items-center gap-1 ${
              index > 0 ? "border-l border-gray-200 dark:border-gray-700" : ""
            }`}
          >
            <Skeleton className="h-5 w-8 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </View>
        ))}
      </View>
    </View>
  );
}
