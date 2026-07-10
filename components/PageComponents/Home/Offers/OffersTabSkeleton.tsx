import { View } from "react-native";
import { HomeChromeScrollView } from "@/components/ui/HomeChromeScrollView";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

function OfferCardSkeleton() {
  return (
    <WhiteBox>
      <Skeleton className="h-44 w-full rounded-xl" />
      <View className="gap-1.5 px-3 pb-3 pt-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <View className="mt-1 flex-row items-center gap-1">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3 flex-1" />
        </View>
        <View className="mt-2 flex-row gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
          <Skeleton className="h-3.5 w-24 rounded-full" />
        </View>
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
    <HomeChromeScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-6 gap-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </View>
      <OffersSectionSkeleton />
      <OffersSectionSkeleton />
    </HomeChromeScrollView>
  );
}
