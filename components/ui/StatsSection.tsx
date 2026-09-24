import { Pressable, Text, View } from "react-native";
import { cn } from "@/utils/cn";
import { WhiteBox } from "./WhiteBox";

export interface StatsSectionItem {
  value: string;
  label: string;
  onPress?: () => void;
}

interface StatsSectionProps {
  items: StatsSectionItem[];
  className?: string;
  itemClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function StatsSection({
  items,
  className,
  itemClassName,
  valueClassName,
  labelClassName,
}: StatsSectionProps) {
  return (
    <WhiteBox className={className}>
      <View className={cn("flex-row")}>
        {items.map((item, index) => {
          const content = (
            <>
              <Text
                className={cn(
                  "font-geist-extrabold text-[17px] text-ink dark:text-gray-100",
                  valueClassName,
                )}
              >
                {item.value}
              </Text>
              <Text
                className={cn(
                  "mt-0.5 font-geist-semibold text-[11.5px] uppercase text-gray-400 dark:text-gray-500",
                  labelClassName,
                )}
              >
                {item.label}
              </Text>
            </>
          );

          return (
            <View
              key={`${item.label}-${index}`}
              className={cn(
                "flex-1 items-center",
                index > 0 && "border-l border-gray-200 dark:border-gray-700",
                itemClassName,
              )}
            >
              {item.onPress ? (
                <Pressable
                  onPress={item.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  className="w-full items-center active:opacity-70"
                  hitSlop={6}
                >
                  {content}
                </Pressable>
              ) : (
                content
              )}
            </View>
          );
        })}
      </View>
    </WhiteBox>
  );
}
