import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { ChevronUp } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { NoImage } from "@/components/ui/NoImage";
import { PickPreviewImage } from "@/components/ui/PickPreviewImage";
import { ScrollableContainer } from "@/components/ui/ScrollableContainer";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/utils/cn";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { isOthersCategoryName } from "@/utils/listCategories";
import type { Item } from "@/http/list-api/types";

type PersonalityColor = Record<string, number> | null | undefined;

export function getPickImageUrl(item: Item): string | null {
  return (
    resolveImageUrl(item.images?.[0]?.url) ??
    resolveImageUrl(item.business?.logo)
  );
}

export function getPickName(item: Item): string | null {
  return item.business?.name ?? item.unverified_business?.name ?? null;
}

export function formatPickSubtitle(item: Item, fallbackCity?: string): string {
  const category = item.categories?.[0];
  const categoryLabel = category
    ? isOthersCategoryName(category)
      ? (item.others_name ?? category)
      : category
    : null;
  const city = item.location?.city || fallbackCity;

  return [categoryLabel, city].filter(Boolean).join(" · ");
}

interface PickPreviewRowProps {
  item: Item;
  index: number;
  personalityColor?: PersonalityColor;
  onPress: () => void;
}

export function PickPreviewRow({
  item,
  index,
  personalityColor,
  onPress,
}: PickPreviewRowProps) {
  const name = getPickName(item);
  if (!name) return null;

  const imageUrl = getPickImageUrl(item);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      className="cursor-pointer flex-row items-center gap-3 py-1"
    >
      <PickPreviewImage
        imageUrl={imageUrl}
        index={index}
        personalityColor={personalityColor}
      />

      <View className="min-w-0 flex-1 justify-center">
        <Text
          className="font-geist-semibold text-md text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {name}
        </Text>
        {item.description ? (
          <Text
            className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {item.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

interface ListPickSectionProps {
  items: Item[] | undefined;
  listId: string;
  personalityColor?: PersonalityColor;
  fallbackCity?: string;
  onPickPress: (item: Item) => void;
  /** Outer spacing only; the shell styling stays internal. */
  className?: string;
}

export function ListPickSection({
  items,
  listId,
  personalityColor,
  fallbackCity,
  onPickPress,
  className = "mx-4 mb-3",
}: ListPickSectionProps) {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.theme) === "dark";
  const showLessIconColor = isDark ? "#9CA3AF" : "#6B7280";
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [listId]);

  const namedPicks = useMemo(() => {
    const named = (items ?? []).filter((item) => Boolean(getPickName(item)));
    const withImage: Item[] = [];
    const withoutImage: Item[] = [];
    for (const item of named) {
      if (getPickImageUrl(item)) {
        withImage.push(item);
      } else {
        withoutImage.push(item);
      }
    }
    return [...withImage, ...withoutImage];
  }, [items]);

  const featuredPick = namedPicks[0];
  if (!featuredPick) return null;

  const featuredPickImageUrl = getPickImageUrl(featuredPick);
  const featuredPickSubtitle = formatPickSubtitle(featuredPick, fallbackCity);
  const extraPickCount = Math.max(0, namedPicks.length - 1);
  const showAll = expanded && extraPickCount > 0;

  return (
    <View
      className={cn(
        "rounded-2xl px-3 pt-3 bg-soft dark:bg-gray-800",
        showAll ? "pb-1" : "pb-3",
        className,
      )}
    >
      {showAll ? (
        <>
          <ScrollableContainer className="max-h-44">
            {namedPicks.map((item, index) => (
              <View
                key={item.id}
                className={
                  index > 0
                    ? "border-t border-gray-200/60 dark:border-gray-700/60"
                    : undefined
                }
              >
                <PickPreviewRow
                  item={item}
                  index={index}
                  personalityColor={personalityColor}
                  onPress={() => onPickPress(item)}
                />
              </View>
            ))}
          </ScrollableContainer>

          <Pressable
            onPress={() => setExpanded(false)}
            accessibilityRole="button"
            accessibilityLabel={t("home.showLessPicks")}
            accessibilityState={{ expanded: true }}
            className="mt-1 cursor-pointer flex-row items-center justify-center gap-1.5 border-t border-gray-200/80 pt-2.5 pb-1.5 dark:border-gray-700"
            hitSlop={4}
          >
            <ChevronUp size={15} color={showLessIconColor} />
            <Text className="font-geist-semibold text-[13px] text-gray-600 dark:text-gray-300">
              {t("home.showLessPicks")}
            </Text>
          </Pressable>
        </>
      ) : (
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => onPickPress(featuredPick)}
            accessibilityRole="button"
            accessibilityLabel={getPickName(featuredPick) ?? undefined}
            className="min-w-0 flex-1 cursor-pointer flex-row items-center gap-3"
          >
            {featuredPickImageUrl ? (
              <Image
                source={{ uri: featuredPickImageUrl }}
                className="h-9 w-9 shrink-0 rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <NoImage
                personalityColor={personalityColor}
                size="xs"
                appearance="flat"
                outerClassName="dark:!bg-white/30"
              />
            )}

            <View className="min-w-0 flex-1 justify-center">
              <Text
                className="font-geist-semibold text-md text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {getPickName(featuredPick)}
              </Text>
              {featuredPickSubtitle ? (
                <Text
                  className="font-geist text-xs text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                >
                  {featuredPickSubtitle}
                </Text>
              ) : null}
            </View>
          </Pressable>

          {extraPickCount > 0 ? (
            <Pressable
              onPress={() => setExpanded(true)}
              accessibilityRole="button"
              accessibilityLabel={t("home.seeMorePicks", {
                count: extraPickCount,
              })}
              accessibilityState={{ expanded: false }}
              className="h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-white dark:bg-gray-900"
            >
              <Text className="text-md text-ink dark:text-gray-100">
                {t("home.morePicksBadge", { count: extraPickCount })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}
