import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileInfoSkeleton() {
  return (
    <View className="px-4 pb-1">
      <View className="items-center px-2 pt-0.5">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="mt-3 h-7 w-44 rounded-lg" />
        <Skeleton className="mt-1.5 h-4 w-32 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-64 rounded-lg" />
        <Skeleton className="mt-1 h-4 w-48 rounded-lg" />
        <Skeleton className="mt-2 h-3.5 w-40 rounded-lg" />
      </View>

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

      <View className="mt-3.5 flex-row items-center gap-2.5 pb-1">
        <Skeleton className="h-[46px] flex-1 rounded-full" />
        <Skeleton className="h-[46px] w-13 rounded-full" />
      </View>
    </View>
  );
}
