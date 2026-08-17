import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

function OfferCardSkeleton() {
  return (
    <WhiteBox className="overflow-hidden p-0">
      <Skeleton className="aspect-[16/10.5] w-full rounded-none" />
      <View className="gap-2 px-4 pt-2.5">
        <View className="flex-row items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <View className="min-w-0 flex-1 gap-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </View>
          <Skeleton className="h-10 w-24 rounded-full" />
        </View>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </View>
      <View className="mt-1 flex-row items-center gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
        <Skeleton className="h-3.5 w-10 rounded-full" />
        <Skeleton className="h-3.5 w-10 rounded-full" />
        <Skeleton className="h-3.5 w-10 rounded-full" />
        <Skeleton className="h-3.5 w-16 rounded-full" />
        <View className="flex-1" />
        <Skeleton className="h-3.5 w-20 rounded-full" />
      </View>
    </WhiteBox>
  );
}

function OffersSectionSkeleton() {
  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <View className="min-w-0 flex-1 gap-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </View>
        </View>
        <Skeleton className="ml-2 h-6 w-8 rounded-md" />
      </View>
      <View className="gap-4">
        <OfferCardSkeleton />
        <OfferCardSkeleton />
      </View>
    </View>
  );
}

export function OffersTabSkeleton() {
  return (
    <View className="px-4 pb-8">
      <View className="mb-6 gap-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </View>
      <OffersSectionSkeleton />
      <OffersSectionSkeleton />
    </View>
  );
}
