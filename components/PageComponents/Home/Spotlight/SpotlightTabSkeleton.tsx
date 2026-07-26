import { ScrollView, View } from "react-native";
import { HomeChromeScrollView } from "@/components/ui/HomeChromeScrollView";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhiteBox } from "@/components/ui/WhiteBox";

function SectionHeaderSkeleton() {
  return (
    <View className="flex-row items-baseline gap-2 px-5">
      <Skeleton className="h-3 w-5 rounded" />
      <Skeleton className="h-4 w-1/2 rounded-lg" />
    </View>
  );
}

function HeroSkeleton() {
  return <Skeleton className="mx-4 mt-3 h-[158px] w-auto rounded-[18px]" />;
}

function PicksSectionSkeleton() {
  return (
    <View className="mt-[18px]">
      <SectionHeaderSkeleton />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerClassName="gap-2.5 px-5"
        className="mt-2.5"
      >
        <Skeleton className="h-[216px] w-[168px] rounded-2xl" />
        <Skeleton className="h-[216px] w-[168px] rounded-2xl" />
        <Skeleton className="h-[216px] w-[168px] rounded-2xl" />
      </ScrollView>
    </View>
  );
}

function ListsSectionSkeleton() {
  return (
    <View className="mt-[18px]">
      <SectionHeaderSkeleton />
      <Skeleton className="mx-5 mt-2.5 h-[136px] rounded-[18px]" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerClassName="gap-2.5 px-5"
        className="mt-2.5"
      >
        <Skeleton className="h-[122px] w-[208px] rounded-2xl" />
        <Skeleton className="h-[122px] w-[208px] rounded-2xl" />
        <Skeleton className="h-[122px] w-[208px] rounded-2xl" />
      </ScrollView>
    </View>
  );
}

function CuratorsSectionSkeleton() {
  return (
    <View className="mt-[18px]">
      <SectionHeaderSkeleton />
      <WhiteBox className="mx-5 mt-2.5 gap-3 border-0 bg-ink dark:bg-ink">
        <View className="flex-row items-center gap-2.5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <View className="flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/5 rounded-lg" />
            <Skeleton className="h-3 w-1/3 rounded-lg" />
          </View>
        </View>
        <Skeleton className="h-3 w-4/5 rounded-lg" />
        <View className="flex-row gap-2">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </View>
      </WhiteBox>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerClassName="gap-2.5 px-5"
        className="mt-2.5"
      >
        <Skeleton className="h-[130px] w-[112px] rounded-[15px]" />
        <Skeleton className="h-[130px] w-[112px] rounded-[15px]" />
        <Skeleton className="h-[130px] w-[112px] rounded-[15px]" />
        <Skeleton className="h-[130px] w-[112px] rounded-[15px]" />
      </ScrollView>
    </View>
  );
}

export function SpotlightTabSkeleton() {
  return (
    <HomeChromeScrollView
      className="flex-1"
      contentContainerClassName="pb-8"
      showsVerticalScrollIndicator={false}
    >
      <HeroSkeleton />
      <PicksSectionSkeleton />
      <ListsSectionSkeleton />
      <CuratorsSectionSkeleton />
    </HomeChromeScrollView>
  );
}
