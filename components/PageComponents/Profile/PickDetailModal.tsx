import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  InteractionManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ChevronRight,
  MapPin,
  Navigation,
  Share as ShareIcon,
  X,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ListDetailModal } from "@/components/ui/ListDetailModal";
import { ImageFullScreen } from "@/components/ui/ImageFullScreen";
import { NoImage } from "@/components/ui/NoImage";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { openInMaps } from "@/utils/smartPick";
import { isOthersCategoryName } from "@/utils/listCategories";
import { getEmbeddedMatchPercent } from "@/utils/matchScore";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import { Badge } from "@/components/ui/Badge";

interface PickDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data: ListItemPublic;
}

const GRADIENT_FILL = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 18,
};

function formatLocationLabel(location: ListItemPublic["location"]): string | null {
  if (!location) return null;
  return (
    [location.street_address, location.city, location.region]
      .filter(Boolean)
      .join(", ") ||
    location.country ||
    null
  );
}

function formatCategoryLabel(data: ListItemPublic): string | null {
  if (data.categories.length === 0) return null;
  return data.categories
    .map((category) =>
      isOthersCategoryName(category) ? (data.others_name ?? category) : category,
    )
    .join(" · ");
}

function getListCoverImageUrl(list: ListItemDAO): string | null {
  const cover = resolveImageUrl(list.image_url);
  if (cover) return cover;

  for (const item of list.items ?? []) {
    const itemImage =
      resolveImageUrl(item.images?.[0]?.url) ??
      resolveImageUrl(item.business?.logo);
    if (itemImage) return itemImage;
  }

  return null;
}

interface AppearsInListCardProps {
  list: ListItemDAO;
  onPress: () => void;
}

function AppearsInListCard({ list, onPress }: AppearsInListCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const imageUrl = getListCoverImageUrl(list);
  const chevronColor = colorScheme === "dark" ? "#E5E7EB" : "#1F2937";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={list.name}
      className="cursor-pointer flex-row items-center gap-3 rounded-xl bg-white p-2 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
    >
      {imageUrl ? (
        <View className="h-[40px] w-[40px] shrink-0 overflow-hidden rounded-lg bg-soft dark:bg-gray-800">
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        </View>
      ) : (
        <NoImage
          size="md"
          appearance="flat"
          personalityColor={list.account.personality_color}
          outerClassName="h-[40px] w-[40px]"
        />
      )}

      <View className="min-w-0 flex-1">
        <Text
          className="font-geist-bold text-md leading-6 text-ink dark:text-gray-100"
          numberOfLines={2}
        >
          {list.name}
        </Text>
        <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("profile.picks.byAuthor", { name: list.account.name })}
        </Text>
      </View>

      <ChevronRight size={22} color={chevronColor} />
    </Pressable>
  );
}

export function PickDetailModal({
  visible,
  onClose,
  data,
}: PickDetailModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { height, width } = useWindowDimensions();
  const isDark = colorScheme === "dark";
  const directionsIconColor = isDark ? "#141413" : "#FFFFFF";
  const actionIconColor = isDark ? "#E5E7EB" : "#374151";
  const [isImageFullScreenVisible, setIsImageFullScreenVisible] =
    useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [relatedLists, setRelatedLists] = useState<ListItemDAO[]>([]);
  const [isRelatedListsLoading, setIsRelatedListsLoading] = useState(false);
  const [isRelatedListsError, setIsRelatedListsError] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [isListDetailOpen, setIsListDetailOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  useEffect(() => {
    setPhotoIndex(0);
  }, [data.id]);

  useEffect(() => {
    if (!visible) {
      setIsListDetailOpen(false);
      setSelectedListId(null);
    }
  }, [visible]);

  const title = data.business_name?.trim() || t("profile.picks.untitled");
  const locationLabel = formatLocationLabel(data.location);
  const categoryLabel = formatCategoryLabel(data);
  // Server-computed against the pick's owner; hidden on your own picks.
  const showMatch = !data.is_owner;
  const personalityMatch = getEmbeddedMatchPercent(data.owner) ?? 0;
  const hasCoords =
    data.location?.latitude != null &&
    data.location?.longitude != null &&
    !(data.location.latitude === 0 && data.location.longitude === 0);
  const photos = useMemo(
    () =>
      data.images
        .map((img) => resolveImageUrl(img.url) ?? img.url)
        .filter(Boolean),
    [data.images],
  );
  const hasPhotos = photos.length > 0;
  const tagLabels = useMemo(
    () => data.tags.map((tag) => tag.name).filter(Boolean),
    [data.tags],
  );

  const loadRelatedLists = useCallback(
    async (opts?: { fromPull?: boolean; pickId?: string }) => {
      const pickId = opts?.pickId ?? data.id;

      if (opts?.fromPull) {
        setIsPullRefreshing(true);
      } else {
        setIsRelatedListsLoading(true);
      }
      setIsRelatedListsError(false);

      try {
        const response = await listService.searchLists({
          listItemId: pickId,
          limit: 50,
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.data?.data ?? [];
      } catch (error) {
        console.error("Failed to load related lists:", error);
        throw error;
      } finally {
        setIsRelatedListsLoading(false);
        setIsPullRefreshing(false);
      }
    },
    [data.id],
  );

  useEffect(() => {
    if (!visible) {
      setRelatedLists([]);
      setIsRelatedListsLoading(false);
      setIsRelatedListsError(false);
      setIsPullRefreshing(false);
      return;
    }

    const pickId = data.id;
    let cancelled = false;

    setIsRelatedListsLoading(true);
    setIsRelatedListsError(false);

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      void loadRelatedLists({ pickId })
        .then((lists) => {
          if (cancelled) return;
          setRelatedLists(lists ?? []);
        })
        .catch(() => {
          if (cancelled) return;
          setRelatedLists([]);
          setIsRelatedListsError(true);
        });
    });

    return () => {
      cancelled = true;
      interactionHandle.cancel();
    };
  }, [data.id, loadRelatedLists, visible]);

  const refreshRelatedLists = useCallback(
    async (opts?: { fromPull?: boolean }) => {
      try {
        const lists = await loadRelatedLists(opts);
        setRelatedLists(lists ?? []);
        setIsRelatedListsError(false);
      } catch {
        setRelatedLists([]);
        setIsRelatedListsError(true);
      }
    },
    [loadRelatedLists],
  );

  const handleDirections = useCallback(() => {
    if (!hasCoords || !data.location) return;
    openInMaps(data.location.latitude, data.location.longitude, title);
  }, [hasCoords, data.location, title]);

  const handleShare = useCallback(async () => {
    try {
      const message = [title, data.description].filter(Boolean).join("\n");
      await Share.share({ message, title });
    } catch (error) {
      console.error("Failed to share pick:", error);
    }
  }, [title, data.description]);

  const handleCarouselScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (carouselWidth <= 0) return;
      const next = Math.round(
        event.nativeEvent.contentOffset.x / carouselWidth,
      );
      setPhotoIndex(Math.max(0, Math.min(next, photos.length - 1)));
    },
    [carouselWidth, photos.length],
  );

  const isImageViewerOpen =
    isImageFullScreenVisible && photos.length > 0;
  const isPickSheetVisible = visible && !isImageViewerOpen && !isListDetailOpen;

  const sheetMaxHeight = height * 0.7;
  const appearsInCount =
    relatedLists.length > 0 ? relatedLists.length : data.list_usage_count;
  const shouldShowAppearsInSection =
    relatedLists.length > 0 ||
    data.list_usage_count > 0 ||
    isRelatedListsLoading ||
    isRelatedListsError;

  return (
    <>
      <Modal
        visible={isPickSheetVisible}
        onClose={onClose}
        position="bottom"
        withCloseIcon={false}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: sheetMaxHeight }}
          className="-mx-8"
          contentContainerClassName="pb-6"
          refreshControl={
            <AppRefreshControl
              refreshing={isPullRefreshing}
              onRefresh={() => {
                void refreshRelatedLists({ fromPull: true });
              }}
            />
          }
        >
          {hasPhotos ? (
            <View className="mx-3.5 mt-1">
              <View
                className="relative overflow-hidden rounded-[18px]"
                onLayout={(event) =>
                  setCarouselWidth(event.nativeEvent.layout.width)
                }
              >
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleCarouselScroll}
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={handleCarouselScroll}
                >
                  {photos.map((uri, index) => (
                    <Pressable
                      key={`${uri}-${index}`}
                      onPress={() => {
                        setSelectedImageIndex(index);
                        setIsImageFullScreenVisible(true);
                      }}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={t("profile.picks.viewPhoto", {
                        current: index + 1,
                        total: photos.length,
                      })}
                      className="cursor-pointer"
                      style={{
                        width: carouselWidth || width - 64,
                        aspectRatio: 16 / 9,
                      }}
                    >
                      <Image
                        source={{ uri }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    </Pressable>
                  ))}
                </ScrollView>

                <LinearGradient
                  colors={[
                    "rgba(12,10,8,0.88)",
                    "rgba(12,10,8,0.45)",
                    "rgba(12,10,8,0)",
                  ]}
                  locations={[0, 0.42, 0.66]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={GRADIENT_FILL}
                  pointerEvents="none"
                />

                <View
                  className="absolute bottom-3 left-4 right-[70px] z-[2]"
                  pointerEvents="none"
                >
                  <Text
                    className="font-geist-bold text-4xl capitalize text-white"
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  {categoryLabel ? (
                    <Text className="mt-1 font-geist-semibold text-lg text-white/90">
                      {categoryLabel}
                    </Text>
                  ) : null}
                </View>

                {photos.length > 1 ? (
                  <View className="absolute bottom-2.5 right-2.5 z-[3] rounded-full bg-black/60 px-2.5 py-1">
                    <Text className="font-geist-bold text-[11px] text-white">
                      {t("profile.picks.photoCount", {
                        current: photoIndex + 1,
                        total: photos.length,
                      })}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={t("profile.picks.closeDetails")}
                  className="absolute right-2.5 top-2.5 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                  hitSlop={4}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-white/90">
                    <X size={15} color="#57534E" strokeWidth={2.4} />
                  </View>
                </Pressable>
              </View>

              {locationLabel || showMatch ? (
                <View className="mt-3 flex-row items-center gap-1.5 px-1.5">
                  {locationLabel ? (
                    <>
                      <MapPin size={14} color="#57534E" />
                      <Text
                        className="flex-1 font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400"
                        numberOfLines={2}
                      >
                        {locationLabel}
                      </Text>
                    </>
                  ) : (
                    <View className="flex-1" />
                  )}
                  {showMatch ? (
                    <PersonalityMatchPill
                      percent={personalityMatch}
                      personalityColor={data.owner?.personality_color}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : (
            <View className="relative px-5 pt-1">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("profile.picks.closeDetails")}
                className="absolute right-3 top-0 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                hitSlop={4}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-soft dark:bg-gray-800">
                  <X size={15} color="#57534E" strokeWidth={2.4} />
                </View>
              </Pressable>

              <Text
                className="pr-12 font-geist-extrabold text-2xl leading-7 text-ink dark:text-gray-100"
                numberOfLines={3}
              >
                {title}
              </Text>

              {locationLabel ? (
                <View className="mt-1 flex-row items-center gap-1.5">
                  <MapPin size={14} color="#57534E" />
                  <Text
                    className="flex-1 font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400"
                    numberOfLines={2}
                  >
                    {locationLabel}
                  </Text>
                </View>
              ) : null}

              {categoryLabel || showMatch ? (
                <View className="mt-1 flex-row items-center gap-1.5">
                  {categoryLabel ? (
                    <Text className="shrink font-geist-semibold text-[13px] text-gray-400">
                      {categoryLabel}
                    </Text>
                  ) : null}
                  {showMatch ? (
                    <PersonalityMatchPill
                      percent={personalityMatch}
                      personalityColor={data.owner?.personality_color}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          )}

          {data.description ? (
            <View className="mx-4 mt-3.5 rounded-2xl bg-soft px-4 py-3.5 dark:bg-gray-800">
              <Text className="font-fraunces text-[15px] italic leading-6 text-ink dark:text-gray-100">
                “{data.description}”
              </Text>
            </View>
          ) : null}

          {/* Tags */}
          {tagLabels.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-1.5 px-4">
              {tagLabels.map((label) => (
                <Badge
                  key={label}
                  label={label}
                  size="md"
                />
          
              ))}
            </View>
          ) : null}

          <View className="mt-3.5 flex-row justify-end gap-2.5 px-4">
            {hasCoords ? (
              <Pressable
                onPress={handleDirections}
                accessibilityRole="button"
                className="min-h-[46px] flex-1 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-full bg-ink dark:bg-gray-100"
              >
                <Navigation size={15} color={directionsIconColor} />
                <Text className="font-geist-bold text-sm text-white dark:text-ink">
                  {t("profile.picks.directions")}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => void handleShare()}
              accessibilityRole="button"
              accessibilityLabel={t("listDetail.share")}
              className="h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-[1.5px] border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            >
              <ShareIcon size={16} color={actionIconColor} />
            </Pressable>
          </View>

          {shouldShowAppearsInSection ? (
            <View className="mt-4 px-4">
              <Text className="px-1 font-geist-bold text-[11.5px] uppercase tracking-wider text-gray-400">
                {t("profile.picks.appearsIn", {
                  count: appearsInCount,
                })}
              </Text>

              <View className="mt-3 gap-3">
                {relatedLists.map((list) => (
                  <AppearsInListCard
                    key={list.id}
                    list={list}
                    onPress={() => {
                      setSelectedListId(list.id);
                      setIsListDetailOpen(true);
                    }}
                  />
                ))}

                {isRelatedListsLoading ? (
                  <Text className="px-1 font-geist-medium text-sm text-gray-400 dark:text-gray-500">
                    {t("profile.lists.loading")}
                  </Text>
                ) : null}

                {isRelatedListsError ? (
                  <Pressable
                    onPress={() => void refreshRelatedLists()}
                    accessibilityRole="button"
                    className="cursor-pointer self-start px-1"
                  >
                    <Text className="font-geist-semibold text-sm text-brand">
                      {t("profile.lists.retry")}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </Modal>

      <ListDetailModal
        visible={isListDetailOpen}
        listId={selectedListId}
        onClose={() => {
          setIsListDetailOpen(false);
          setSelectedListId(null);
        }}
      />

      <ImageFullScreen
        uris={photos}
        initialIndex={selectedImageIndex}
        visible={isImageViewerOpen}
        onClose={() => {
          setIsImageFullScreenVisible(false);
        }}
      />
    </>
  );
}
