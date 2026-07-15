import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Bookmark, Building2, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import { formatListLocation } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import {
  formatPickAddress,
  getPickCategoryLabel,
  getPickName,
} from "@/utils/listPickLocation";
import type { Item, ListItemDAO } from "@/http/list-api/types";
import { Badge } from "@/components/ui/Badge";
import { ImageFullScreen } from "@/components/ui/ImageFullScreen";
import { PageSectionTitle } from "@/components/ui/PageSectionTitle";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";

interface ListDetailsBodyProps {
  list: ListItemDAO;
  onOpenInMaps: (pickIndex: number) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
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
  const [isImageFullScreenVisible, setIsImageFullScreenVisible] =
    useState(false);

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
    <View className="mx-[18px] mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-paper dark:border-gray-700 dark:bg-gray-900">
      <View className="flex-row items-center gap-2.5 border-b border-brand/15 bg-brand-tint px-4 py-3 dark:border-brand/25 dark:bg-brand/10">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-brand">
          <Text className="font-geist-bold text-[11px] text-white">
            {pickNumber}
          </Text>
        </View>
        <Text className="font-geist-bold text-[11px] uppercase tracking-[0.14em] text-brand">
          {/* {t("listDetail.pickEyebrow")} */}
          {name}
        </Text>

        {/* Favorite Button */}
        <View className="flex-1 flex-row justify-end">
          <LocalNotesButton
            onPress={handleToggleFavorite}
            disabled={isTogglingFavorite}
            loading={isTogglingFavorite}
            size="xs"
            variant={isFavorite ? "brand" : "light"}
            isRounded
            isWidthFull={false}
            leftIcon={
              <Bookmark
                size={16}
                color={isFavorite ? "#FFFFFF" : "#737373"}
                fill={isFavorite ? "#FFFFFF" : "transparent"}
                stroke={isFavorite ? "#FFFFFF" : "#737373"}
                style={{ marginRight: 2 }}
              />
            }
            label={
              isFavorite
                ? t("listDetail.savedList")
                : t("listDetail.reactions.save")
            }
          />
   
    
        </View>
      </View>

      <View className="px-4 py-4">
        {imageUrl ? (
          <>
            <Pressable
              onPress={() => setIsImageFullScreenVisible(true)}
              accessibilityRole="imagebutton"
              className="relative mb-3 h-40 overflow-hidden rounded-xl cursor-pointer"
            >
              <View pointerEvents="none" className="h-full w-full">
                <Image
                  source={{ uri: imageUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              </View>
            </Pressable>
            <ImageFullScreen
              uri={imageUrl}
              visible={isImageFullScreenVisible}
              onClose={() => setIsImageFullScreenVisible(false)}
            />
          </>
        ) : null}

        {categoryLabel ? (
          <Badge label={categoryLabel} variant="primary" size="md" />
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
      </View>
    </View>
  );
}

export function ListDetailsBody({ list, onOpenInMaps }: ListDetailsBodyProps) {
  const { t } = useTranslation();
  const locationLabel = formatListLocation(list.location);
  const picksCount = list.items?.length ?? 0;
  const sortedItems = sortItemsWithImagesFirst(list.items ?? []);

  return (
    <View>
      <View className="px-[18px] pt-1">
        <View className="flex-col items-center gap-2 text-center">
          <Text className="font-geist-bold text-2xl leading-7 text-ink dark:text-gray-100 mb-2">
            {list.name}
          </Text>

          <View className="flex-row items-center gap-2">
            {list.categories.length > 0
              ? list.categories.map((category) => (
                  <Badge
                    key={category}
                    label={category}
                    variant="primary"
                    className="mb-4"
                  />
                ))
              : null}
          </View>
        </View>

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

      <View className="mt-1 border-t border-gray-200 bg-soft/70 pb-4 pt-5 dark:border-gray-800 dark:bg-gray-900/40">
        <View className="mb-4 px-[18px]">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1 flex-row items-start gap-2.5">
              <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-brand-tint dark:bg-brand/20">
                <Building2 size={16} color="#FF6B1A" />
              </View>
              <View className="min-w-0 flex-1">
                <PageSectionTitle className="text-brand dark:text-brand">
                  {t("listDetail.picksSection")}
                </PageSectionTitle>
                <Text className="mt-1 font-geist text-xs leading-4 text-gray-500 dark:text-gray-400">
                  {t("listDetail.picksSectionSubtitle")}
                </Text>
              </View>
            </View>
            <Badge label={t("home.picksCount", { count: picksCount })} variant="primary" size="md" />
          </View>
        </View>

        {sortedItems.length === 0 ? (
          <Text className="px-[18px] font-geist text-sm text-gray-500 dark:text-gray-400">
            {t("listDetail.noPicks")}
          </Text>
        ) : (
          sortedItems.map(({ item, originalIndex }) => (
            <ListDetailsPickCard
              key={item.id}
              item={item}
              index={originalIndex}
              list={list}
              onOpenInMaps={onOpenInMaps}
            />
          ))
        )}
      </View>
    </View>
  );
}
