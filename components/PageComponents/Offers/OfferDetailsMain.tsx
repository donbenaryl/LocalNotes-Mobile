import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Calendar, Clock, Eye, Heart, Play, Share2, X } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ImageFullScreen, type MediaItem } from "@/components/ui/ImageFullScreen";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { usePlayableVideoUri } from "@/hooks/usePlayableVideoUri";
import notesService from "@/http/notes-api/notes.service";
import type { NoteDAO } from "@/http/notes-api/types";
import { mapNoteDaoToOfferItem } from "@/types/offer";
import { isOthersCategoryName } from "@/utils/listCategories";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getTimeLeftLabel, formatRelativeTime } from "@/utils/time";

/** Modal drag handle (pt-3 pb-3) + sheet bottom padding (pb-10). */
const SHEET_CHROME = 12 + 12 + 40;

interface OfferMediaItem extends MediaItem {
  id: string;
}

interface OfferHeroVideoPreviewProps {
  /** Already-playable URI (local file:// when iOS cached a cleartext http source). */
  uri: string;
}

/** Autoplaying, muted, looped preview of the hero video (tap opens the fullscreen player). */
function OfferHeroVideoPreview({ uri }: OfferHeroVideoPreviewProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View pointerEvents="none" style={{ width: "100%", height: "100%" }}>
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
        // Overlapping views (play-icon on top) can lose correct
        // z-order/touch behavior with the default surfaceView on Android.
        surfaceType="textureView"
      />
    </View>
  );
}

interface OfferHeroVideoSlotProps {
  posterUri: string | null;
  playableUri: string | null;
  isPreparing: boolean;
}

/** Poster / spinner until a playable URI is ready, then muted looping preview. */
function OfferHeroVideoSlot({
  posterUri,
  playableUri,
  isPreparing,
}: OfferHeroVideoSlotProps) {
  if (playableUri) {
    return <OfferHeroVideoPreview uri={playableUri} />;
  }

  if (posterUri) {
    return (
      <Image
        source={{ uri: posterUri }}
        className="h-full w-full"
        resizeMode="cover"
      />
    );
  }

  return (
    <View className="h-full w-full items-center justify-center bg-black">
      {isPreparing ? <ActivityIndicator color="#FFFFFF" /> : null}
    </View>
  );
}

function OfferDetailsSkeleton() {
  return (
    <>
      <Skeleton className="aspect-[16/10.5] w-full rounded-none" />
      <View className="gap-2 px-8 pt-3.5">
        <View className="mb-1 flex-row items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <View className="min-w-0 flex-1 gap-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </View>
        </View>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <View className="mt-2 flex-row items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          <Skeleton className="h-3.5 w-10 rounded-full" />
          <Skeleton className="h-3.5 w-10 rounded-full" />
          <Skeleton className="h-3.5 w-10 rounded-full" />
          <Skeleton className="h-3.5 w-16 rounded-full" />
        </View>
      </View>
    </>
  );
}

interface OfferDetailsMainProps {
  noteId?: string;
  visible: boolean;
  onClose: () => void;
}

export function OfferDetailsMain({
  noteId,
  visible,
  onClose,
}: OfferDetailsMainProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconMuted = colorScheme === "dark" ? "#9CA3AF" : "#57534E";
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollMaxHeight = height - insets.top - SHEET_CHROME;

  const {
    data: note,
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["note-detail", noteId],
    enabled: visible && Boolean(noteId),
    queryFn: async (): Promise<NoteDAO | null> => {
      if (!noteId) return null;
      const response = await notesService.fetchNoteById(noteId);
      return response.data?.data ?? null;
    },
  });

  const viewedNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!noteId || !note) return;
    if (viewedNoteIdRef.current === noteId) return;
    viewedNoteIdRef.current = noteId;
    void notesService.viewNote(noteId);
  }, [noteId, note]);

  const offer = note ? mapNoteDaoToOfferItem(note) : null;

  const mediaItems = useMemo<OfferMediaItem[]>(
    () =>
      (note?.media ?? [])
        .map((item) => {
          const uri = resolveImageUrl(item.url) ?? item.url;
          if (!uri) return null;
          return { id: item.id, type: item.media_type, uri };
        })
        .filter((item): item is OfferMediaItem => item != null),
    [note?.media],
  );
  const hasMedia = mediaItems.length > 0;
  const firstImageUri =
    mediaItems.find((item) => item.type === "image")?.uri ?? null;

  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);

  useEffect(() => {
    setMediaIndex(0);
    setSelectedMediaIndex(0);
  }, [noteId]);

  const activeVideoUri =
    mediaItems[mediaIndex]?.type === "video"
      ? mediaItems[mediaIndex].uri
      : null;

  const {
    playableUri: playableVideoUri,
    isPreparing: isVideoPreparing,
  } = usePlayableVideoUri(activeVideoUri);

  const isPreviewOpen = isPreviewVisible && hasMedia;
  const isSheetVisible = visible && !isPreviewOpen;

  const handleCarouselScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (carouselWidth <= 0) return;
      const next = Math.round(
        event.nativeEvent.contentOffset.x / carouselWidth,
      );
      setMediaIndex(Math.max(0, Math.min(next, mediaItems.length - 1)));
    },
    [carouselWidth, mediaItems.length],
  );

  const handleShare = async () => {
    if (!offer) return;
    try {
      const message = [offer.title, offer.content].filter(Boolean).join("\n");
      await Share.share({ message, title: offer.title });
    } catch (error) {
      console.error("Failed to share offer:", error);
    }
  };

  const categoriesSubtitle = offer?.categories?.length
    ? offer.categories
        .map((category) =>
          isOthersCategoryName(category) ? (offer.others_name ?? category) : category,
        )
        .join(" · ")
    : undefined;
  const untilLabel = offer?.expiresAt ? getTimeLeftLabel(offer.expiresAt) : "";
  const isLessThanADay = untilLabel.includes("left");
  const locationLabel = offer?.businessBranches?.[0] ?? t("offers.noLocation");
  const postedLabel = offer ? formatRelativeTime(offer.postedAt) : "";

  const fullscreenMedia = useMemo<MediaItem[]>(
    () => mediaItems.map(({ type, uri }) => ({ type, uri })),
    [mediaItems],
  );

  return (
    <>
      <Modal
        visible={isSheetVisible}
        onClose={onClose}
        position="bottom"
        withCloseIcon={false}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: scrollMaxHeight }}
          className="-mx-8"
          contentContainerClassName="pb-2"
          // RefreshControl blanks flex ScrollViews on Android.
          refreshControl={
            Platform.OS === "android" ? undefined : (
              <AppRefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
              />
            )
          }
        >
          {!noteId ? (
            <View className="relative items-center justify-center px-6 py-16">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("offers.detail.closeDetails")}
                className="absolute right-3 top-0 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                hitSlop={4}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-soft dark:bg-gray-800">
                  <X size={15} color="#57534E" strokeWidth={2.4} />
                </View>
              </Pressable>
              <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
                {t("offers.detail.error")}
              </Text>
            </View>
          ) : isPending ? (
            <OfferDetailsSkeleton />
          ) : isError || !offer || !note ? (
            <View className="relative items-center justify-center px-6 py-16">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("offers.detail.closeDetails")}
                className="absolute right-3 top-0 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                hitSlop={4}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-soft dark:bg-gray-800">
                  <X size={15} color="#57534E" strokeWidth={2.4} />
                </View>
              </Pressable>
              <Text className="mb-4 text-center font-geist text-base text-gray-500 dark:text-gray-400">
                {t("offers.detail.error")}
              </Text>
              <LocalNotesButton
                label={t("offers.retry")}
                onPress={() => void refetch()}
                variant="brand"
                size="sm"
                isWidthFull={false}
              />
            </View>
          ) : (
            <>
              {hasMedia ? (
                <View className="mx-3.5 mt-1">
                  <View
                    className="relative overflow-hidden rounded-[18px]"
                    onLayout={(e) =>
                      setCarouselWidth(e.nativeEvent.layout.width)
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
                      {mediaItems.map((item, index) => (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            setSelectedMediaIndex(index);
                            setIsPreviewVisible(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t("offers.detail.viewMedia")}
                          className="cursor-pointer"
                          style={{
                            width: carouselWidth || width - 28,
                            aspectRatio: 16 / 10.5,
                          }}
                        >
                          {item.type === "video" ? (
                            <>
                              <OfferHeroVideoSlot
                                posterUri={
                                  index === mediaIndex ? firstImageUri : null
                                }
                                playableUri={
                                  index === mediaIndex ? playableVideoUri : null
                                }
                                isPreparing={
                                  index === mediaIndex && isVideoPreparing
                                }
                              />
                              <View
                                className="absolute inset-0 items-center justify-center"
                                pointerEvents="none"
                              >
                                <View className="h-14 w-14 items-center justify-center rounded-full bg-black/50">
                                  <Play
                                    size={22}
                                    color="#FFFFFF"
                                    fill="#FFFFFF"
                                  />
                                </View>
                              </View>
                            </>
                          ) : (
                            <Image
                              source={{ uri: item.uri }}
                              className="h-full w-full"
                              resizeMode="cover"
                            />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>

                    {mediaItems.length > 1 ? (
                      <View className="absolute bottom-2.5 right-2.5 z-[3] rounded-full bg-black/60 px-2.5 py-1">
                        <Text className="font-geist-bold text-[11px] text-white">
                          {t("profile.picks.photoCount", {
                            current: mediaIndex + 1,
                            total: mediaItems.length,
                          })}
                        </Text>
                      </View>
                    ) : null}

                    <Pressable
                      onPress={onClose}
                      accessibilityRole="button"
                      accessibilityLabel={t("offers.detail.closeDetails")}
                      className="absolute right-2.5 top-2.5 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                      hitSlop={4}
                    >
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-white/90">
                        <X size={15} color="#57534E" strokeWidth={2.4} />
                      </View>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              <View className={`px-8 pt-3.5 ${hasMedia ? "" : "relative"}`}>
                {!hasMedia ? (
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel={t("offers.detail.closeDetails")}
                    className="absolute right-3 top-0 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                    hitSlop={4}
                  >
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-soft dark:bg-gray-800">
                      <X size={15} color="#57534E" strokeWidth={2.4} />
                    </View>
                  </Pressable>
                ) : null}

                <View className={`mb-3 flex-row items-center gap-2.5 ${hasMedia ? "" : "pr-12"}`}>
                  <Avatar
                    name={offer.businessName}
                    src={offer.businessLogoUrl}
                    size="md"
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      className="font-geist-semibold text-[15px] text-ink dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {offer.businessName}
                    </Text>
                    <Text
                      className="font-geist text-[13px] text-gray-500 dark:text-gray-400"
                      numberOfLines={1}
                    >
                      {locationLabel}
                    </Text>
                  </View>
                </View>

                {offer.title ? (
                  <Text className="mb-1 font-geist-extrabold text-[22px] leading-7 text-ink dark:text-gray-100">
                    {offer.title}
                  </Text>
                ) : null}

                {categoriesSubtitle ? (
                  <View className="mb-2 flex-row flex-wrap gap-1.5">
                    <Badge label={categoriesSubtitle} size="md" />
                  </View>
                ) : null}

                <Text className="mb-3 font-geist text-[15px] leading-5 text-gray-600 dark:text-gray-300">
                  {offer.content ?? t("offers.noDetails")}
                </Text>

                <Text className="mb-4 font-geist text-xs text-gray-400 dark:text-gray-500">
                  {t("offers.detail.posted", { time: postedLabel })}
                </Text>

                <View className="flex-row flex-wrap items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <View className="flex-row items-center gap-1.5">
                    <Eye size={14} color={iconMuted} />
                    <Text className="font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400">
                      {offer.views}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <Heart size={14} color={iconMuted} />
                    <Text className="font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400">
                      {offer.likes}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <Share2 size={14} color={iconMuted} />
                    <Text className="font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400">
                      {offer.shares}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    {isLessThanADay ? (
                      <Clock size={14} color="#de4f2d" />
                    ) : (
                      <Calendar size={14} color={iconMuted} />
                    )}
                    <Text
                      className={`font-geist-semibold text-[13px] ${
                        isLessThanADay ? "text-[#de4f2d]" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {untilLabel || t("offers.noExpiration")}
                    </Text>
                  </View>
                </View>

                <LocalNotesButton
                  label={t("listDetail.share")}
                  onPress={() => void handleShare()}
                  variant="ghost"
                  size="sm"
                  isWidthFull={false}
                  className="mt-4 self-start"
                />
              </View>
            </>
          )}
        </ScrollView>
      </Modal>

      <ImageFullScreen
        media={fullscreenMedia}
        initialIndex={selectedMediaIndex}
        visible={isPreviewOpen}
        onClose={() => setIsPreviewVisible(false)}
      />
    </>
  );
}
