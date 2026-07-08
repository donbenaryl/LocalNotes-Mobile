import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import { formatListLocation } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import {
  formatPickAddress,
  getPickCategoryLabel,
  getPickName,
} from "@/utils/listPickLocation";
import type { Item, ListItemDAO } from "@/http/list-api/types";
import { Badge } from "@/components/ui/Badge";
import { NoImage } from "@/components/ui/NoImage";

interface ListDetailsBodyProps {
  list: ListItemDAO;
  onOpenInMaps: (pickIndex: number) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function toLinearGradientColors(
  colors: string[],
): [string, string, ...string[]] {
  if (colors.length === 1) {
    return [colors[0], colors[0]];
  }
  return colors.slice(0, 4) as [string, string, ...string[]];
}

function getPickImageUrl(item: Item): string | null {
  return (
    resolveImageUrl(item.images?.[0]?.url) ??
    resolveImageUrl(item.business?.logo)
  );
}

function sortItemsWithImagesFirst(
  items: Item[],
): { item: Item; originalIndex: number }[] {
  return items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => {
      const aHasImage = Boolean(getPickImageUrl(a.item));
      const bHasImage = Boolean(getPickImageUrl(b.item));
      if (aHasImage === bHasImage) return a.originalIndex - b.originalIndex;
      return aHasImage ? -1 : 1;
    });
}

function getCategoryLabel(list: ListItemDAO): string {
  const category = list.categories?.[0];
  if (!category) return "";
  if (category.toLowerCase() === "others" && list.others_name) {
    return list.others_name;
  }
  return category;
}

interface ListDetailsPickCardProps {
  item: Item;
  index: number;
  list: ListItemDAO;
  onOpenInMaps: (pickIndex: number) => void;
}

function ListDetailsPickCard({
  item,
  index,
  list,
  onOpenInMaps,
}: ListDetailsPickCardProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const [isFavorite, setIsFavorite] = useState(item.is_favorite ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(item.is_favorite ?? false);
  }, [item.id, item.is_favorite]);

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setIsTogglingFavorite(true);
    const { error } = await listService.setListItemFavorite(
      item.id,
      nextFavorite,
    );
    setIsTogglingFavorite(false);

    if (error) {
      setIsFavorite(!nextFavorite);
      showToast({
        type: "error",
        message: error.message ?? t("profile.picks.favoriteError"),
      });
    }
  };

  const name = getPickName(item);
  if (!name) return null;

  const imageUrl = getPickImageUrl(item);
  const categoryLabel = getPickCategoryLabel(item);
  const address = formatPickAddress(item, list.location);
  const pickNumber = String(index + 1).padStart(2, "0");

  return (
    <View className="border-b border-gray-200 px-[18px] py-[18px] dark:border-gray-800">
      <Text className="mb-2 font-geist-bold text-[10px] uppercase tracking-[0.14em] text-gray-400">
        {t("listDetail.pickLabel", { number: pickNumber })}
      </Text>

      {imageUrl && (
        <View className="relative mb-3 h-40 overflow-hidden rounded-xl">
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
        </View>
      )}

      <Text className="font-geist-bold text-lg leading-6 text-ink dark:text-gray-100">
        {name}
      </Text>

      {categoryLabel ? (
        <Text className="mt-1 font-geist-semibold text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {categoryLabel}
        </Text>
      ) : null}

      {item.description ? (
        <Text className="mt-2.5 font-geist text-sm leading-[22px] text-gray-800 dark:text-gray-200">
          {item.description}
        </Text>
      ) : null}

      {item.tags.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <View
              key={tag.id}
              className="rounded-full bg-soft px-2.5 py-1.5 dark:bg-gray-800"
            >
              <Text className="font-geist-medium text-[11px] text-gray-600 dark:text-gray-300">
                {tag.name}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {address ? (
        <View className="mt-3 flex-row items-center gap-1.5">
          <MapPin size={12} color="#737373" />
          <Text
            className="min-w-0 flex-1 font-geist-medium text-xs text-gray-600 dark:text-gray-300"
            numberOfLines={2}
          >
            {address}
          </Text>
          <Pressable
            onPress={() => onOpenInMaps(index)}
            accessibilityRole="button"
            className="cursor-pointer"
          >
            <Text className="font-geist-semibold text-[11.5px] text-brand underline">
              {t("listDetail.openInMaps")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => onOpenInMaps(index)}
          accessibilityRole="button"
          className="mt-3 cursor-pointer self-start"
        >
          <Text className="font-geist-semibold text-[11.5px] text-brand underline">
            {t("listDetail.openInMaps")}
          </Text>
        </Pressable>
      )}

      <View className="mt-3.5 flex-row border-t border-soft pt-3 dark:border-gray-800">
        {/* Favorite Button */}
        <Pressable
          onPress={() => void handleToggleFavorite()}
          disabled={isTogglingFavorite}
          accessibilityRole="button"
          className={`cursor-pointer flex-row items-center gap-1.5 rounded-full border px-2.5 py-1.5 ${
            isFavorite
              ? "border-brand/30 dark:border-brand/30"
              : "border-gray-200 dark:border-gray-700"
          }`}
        >
          <Bookmark
            size={14}
            color={isFavorite ? "#FF6B1A" : "#374151"}
            fill={isFavorite ? "#FF6B1A" : "transparent"}
          />
          <Text
            className={`font-geist-semibold text-xs ${
              isFavorite ? "text-brand" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {isFavorite
              ? t("listDetail.savedList")
              : t("listDetail.reactions.save")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ListDetailsBody({ list, onOpenInMaps }: ListDetailsBodyProps) {
  const { t } = useTranslation();
  const categoryLabel = getCategoryLabel(list);
  const locationLabel = formatListLocation(list.location);
  const picksCount = list.items?.length ?? 0;
  const sortedItems = sortItemsWithImagesFirst(list.items ?? []);

  return (
    <View>
      <View className="px-[18px] pt-1">
        {categoryLabel ? (
          <Badge
            label={categoryLabel}
            variant="primary"
            className="mb-4"
            size="lg"
          />
        ) : null}

        <Text className="font-geist-bold text-2xl leading-7 text-ink dark:text-gray-100">
          {list.name}
        </Text>

        {list.notes ? (
          <Text className="mt-2 font-fraunces text-sm italic leading-5 text-gray-600 dark:text-gray-400">
            {stripHtml(list.notes)}
          </Text>
        ) : null}
      </View>

      <View className="mt-2.5 flex-row flex-wrap items-center gap-3.5 border-b border-gray-200 px-[18px] py-2.5 dark:border-gray-800">
        {locationLabel ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color="#737373" />
            <Text className="font-geist-medium text-[11.5px] text-gray-500 dark:text-gray-400">
              {locationLabel}
            </Text>
          </View>
        ) : null}
        {locationLabel ? (
          <Text className="font-geist-medium text-[11.5px] text-gray-400">
            ·
          </Text>
        ) : null}
        <Text className="font-geist-medium text-[11.5px] text-gray-500 dark:text-gray-400">
          {t("home.picksCount", { count: picksCount })}
        </Text>
        <Text className="ml-auto font-geist-semibold text-[11.5px] text-gray-600 dark:text-gray-300">
          {t("home.savesCount", { count: list.saves ?? 0 })}
        </Text>
      </View>

      {sortedItems.map(({ item, originalIndex }) => (
        <ListDetailsPickCard
          key={item.id}
          item={item}
          index={originalIndex}
          list={list}
          onOpenInMaps={onOpenInMaps}
        />
      ))}
    </View>
  );
}
