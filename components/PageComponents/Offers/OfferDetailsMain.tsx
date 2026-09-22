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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
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
import { mapNoteDaoToOfferItem, type OfferCardItem } from "@/types/offer";
import { cn } from "@/utils/cn";
import { isOthersCategoryName } from "@/utils/listCategories";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getTimeLeftLabel, formatRelativeTime } from "@/utils/time";
import { useLocalSearchParams, usePathname } from "expo-router";
import type { ViewOrigin } from "@/http/types";
import { resolveViewOrigin } from "@/utils/viewTracking";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { toast } from "@/components/ui/Toast";
import { RedeemQrShareCard } from "./RedeemQrShareCard";

function patchOfferListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  offerId: string,
  patch: Pick<OfferCardItem, "isLiked" | "likes">,
) {
  const patchList = (previous: OfferCardItem[] | undefined) => {
    if (!previous) return previous;
    return previous.map((item) =>
      item.id === offerId
        ? { ...item, isLiked: patch.isLiked, likes: patch.likes }
        : item,
    );
  };

  queryClient.setQueriesData<OfferCardItem[]>(
    { queryKey: ["offers-feed"] },
    patchList,
  );
  queryClient.setQueriesData<OfferCardItem[]>(
    { queryKey: ["business-offers"] },
    patchList,
  );
}

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
  viewOrigin?: ViewOrigin;
}

export function OfferDetailsMain({
  noteId,
  visible,
  onClose,
  viewOrigin,
}: OfferDetailsMainProps) {
  const pathname = usePathname();
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const resolvedViewOrigin = resolveViewOrigin({
    explicitOrigin: viewOrigin,
    pathname,
    queryOrigin: origin,
  });
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.businessId);
  const iconMuted = colorScheme === "dark" ? "#9CA3AF" : "#57534E";
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Guard against a 0/negative maxHeight on first Modal presentation.
  const scrollMaxHeight = Math.max(height - insets.top - SHEET_CHROME, 120);

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

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const qrShareCardRef = useRef<View>(null);

  const viewedNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsLiked(note?.is_liked ?? false);
    setLikes(note?.like_count ?? 0);
  }, [noteId, note?.is_liked, note?.like_count]);

  useEffect(() => {
    if (!noteId || !note) return;
    if (viewedNoteIdRef.current === noteId) return;
    viewedNoteIdRef.current = noteId;
    void notesService.viewNote(noteId, {
      source: "mobile",
      origin: resolvedViewOrigin,
    });
  }, [noteId, note, resolvedViewOrigin]);

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

  const applyLikePatch = useCallback(
    (nextLiked: boolean, nextLikes: number) => {
      if (!noteId) return;
      patchOfferListCaches(queryClient, noteId, {
        isLiked: nextLiked,
        likes: nextLikes,
      });
      queryClient.setQueryData<NoteDAO | null>(
        ["note-detail", noteId],
        (previous) =>
          previous
            ? {
                ...previous,
                is_liked: nextLiked,
                like_count: nextLikes,
              }
            : previous,
      );
    },
    [noteId, queryClient],
  );

  const handleLike = useCallback(async () => {
    if (!noteId || isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousLikes = likes;
    const nextLiked = !previousLiked;
    const nextLikes = nextLiked
      ? previousLikes + 1
      : Math.max(0, previousLikes - 1);

    setIsLiked(nextLiked);
    setLikes(nextLikes);
    applyLikePatch(nextLiked, nextLikes);

    try {
      const response = nextLiked
        ? await notesService.likeNote(noteId)
        : await notesService.unlikeNote(noteId);
      if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      console.error("Failed to toggle offer like:", error);
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      applyLikePatch(previousLiked, previousLikes);
    } finally {
      setIsLiking(false);
    }
  }, [noteId, isLiking, isLiked, likes, applyLikePatch]);

  const handleShare = useCallback(async () => {
    if (!offer) return;
    try {
      const message = [offer.title, offer.content].filter(Boolean).join("\n");
      await Share.share({ message, title: offer.title });
    } catch (error) {
      console.error("Failed to share offer:", error);
    }
  }, [offer]);

  const canManageOffer =
    Boolean(note?.business?.id) &&
    Boolean(businessId) &&
    note?.business?.id === businessId;
  const showRedeem = Boolean(note?.is_redeemable) && !canManageOffer;
  const myRedemption = note?.my_redemption ?? null;

  const handleRedeem = useCallback(async () => {
    if (!noteId || isRedeeming) return;
    setIsRedeeming(true);
    try {
      const response = await notesService.redeemNote(noteId);
      if (response.error) {
        toast.error(response.error.message || t("offers.detail.redeemFailed"));
        return;
      }
      const redemption = response.data?.data;
      if (redemption) {
        queryClient.setQueryData<NoteDAO | null>(
          ["note-detail", noteId],
          (previous) =>
            previous
              ? {
                  ...previous,
                  my_redemption: {
                    id: redemption.id,
                    code: redemption.code,
                    used_at: redemption.used_at,
                  },
                }
              : previous,
        );
        toast.success(t("offers.detail.redeemSuccess"));
      }
    } catch (error) {
      console.error("Failed to redeem offer:", error);
      toast.error(t("offers.detail.redeemFailed"));
    } finally {
      setIsRedeeming(false);
    }
  }, [noteId, isRedeeming, queryClient, t]);

  const handleShareCode = useCallback(async () => {
    if (!myRedemption?.code) return;
    try {
      await Share.share({ message: myRedemption.code });
    } catch (error) {
      console.error("Failed to share redeem code:", error);
    }
  }, [myRedemption?.code]);

  const handleDownloadQr = useCallback(async () => {
    if (!myRedemption?.code || !offer || isDownloadingQr) return;
    setIsDownloadingQr(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare || !qrShareCardRef.current) {
        toast.error(t("offers.detail.downloadQrFailed"));
        return;
      }
      const uri = await captureRef(qrShareCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const shareUri = uri.startsWith("file://") ? uri : `file://${uri}`;
      await Sharing.shareAsync(shareUri, {
        mimeType: "image/png",
        dialogTitle: t("offers.detail.downloadQr"),
        UTI: "public.png",
      });
      toast.success(t("offers.detail.downloadQrSuccess"));
    } catch (error) {
      console.error("Failed to download redeem QR:", error);
      toast.error(t("offers.detail.downloadQrFailed"));
    } finally {
      setIsDownloadingQr(false);
    }
  }, [myRedemption?.code, offer, isDownloadingQr, t]);

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
        avoidKeyboard={false}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: scrollMaxHeight, minHeight: 120 }}
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
          ) : isPending && !note ? (
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

                    {/* <Pressable
                      onPress={onClose}
                      accessibilityRole="button"
                      accessibilityLabel={t("offers.detail.closeDetails")}
                      className="absolute right-2.5 top-2.5 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                      hitSlop={4}
                    >
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-white/90">
                        <X size={15} color="#57534E" strokeWidth={2.4} />
                      </View>
                    </Pressable> */}
                  </View>
                </View>
              ) : null}

              <View className={`px-8 pt-3.5 ${hasMedia ? "" : "relative"}`}>
                {/* {!hasMedia ? (
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
                ) : null} */}

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

                {showRedeem ? (
                  <View className="mb-4 rounded-xl border border-brand/30 bg-orange-50 px-4 py-3 dark:border-brand/40 dark:bg-gray-800">
                    {myRedemption?.used_at ? (
                      <Text className="font-geist text-sm text-gray-700 dark:text-gray-300">
                        {t("offers.detail.alreadyUsed")}
                        {myRedemption.code
                          ? ` (${myRedemption.code})`
                          : ""}
                      </Text>
                    ) : myRedemption?.code ? (
                      <View className="gap-3">
                        <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                          {t("offers.detail.yourCode")}
                        </Text>
                        <View className="items-center gap-3">
                          <View className="rounded-xl border border-brand/20 bg-white p-3 dark:border-brand/30 dark:bg-gray-900">
                            <QRCode
                              value={myRedemption.code}
                              size={168}
                              backgroundColor="#FFFFFF"
                              color="#1C1917"
                            />
                          </View>
                          <Text className="font-geist-extrabold text-xl tracking-widest text-ink dark:text-gray-100">
                            {myRedemption.code}
                          </Text>
                        </View>
                        <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                          {t("offers.detail.showAtCounter")}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          <LocalNotesButton
                            label={t("offers.detail.copyCode")}
                            onPress={() => void handleShareCode()}
                            variant="light"
                            size="xs"
                            isWidthFull={false}
                          />
                          <LocalNotesButton
                            label={
                              isDownloadingQr
                                ? t("offers.detail.downloadingQr")
                                : t("offers.detail.downloadQr")
                            }
                            onPress={() => void handleDownloadQr()}
                            variant="brand"
                            size="xs"
                            isWidthFull={false}
                            loading={isDownloadingQr}
                          />
                        </View>
                      </View>
                    ) : (
                      <View className="gap-2">
                        <Text className="font-geist text-sm text-gray-700 dark:text-gray-300">
                          {t("offers.detail.redeemPrompt")}
                        </Text>
                        <LocalNotesButton
                          label={
                            isRedeeming
                              ? t("offers.detail.redeeming")
                              : t("offers.detail.redeem")
                          }
                          onPress={() => void handleRedeem()}
                          variant="brand"
                          size="sm"
                          isWidthFull={false}
                          loading={isRedeeming}
                        />
                      </View>
                    )}
                  </View>
                ) : null}

                <Text className="mb-4 font-geist text-xs text-gray-400 dark:text-gray-500">
                  {t("offers.detail.posted", { time: postedLabel })}
                </Text>

                <View className="flex-row items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <View className="flex-row items-center gap-1.5">
                    <Eye size={14} color={iconMuted} />
                    <Text className="font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400">
                      {offer.views}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => void handleLike()}
                    disabled={isLiking}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isLiked ? t("listDetail.liked") : t("listDetail.like")
                    }
                    accessibilityState={{ disabled: isLiking, selected: isLiked }}
                    className="cursor-pointer flex-row items-center gap-1.5"
                    hitSlop={4}
                  >
                    <Heart
                      size={14}
                      color={isLiked ? "#FF6B1A" : iconMuted}
                      fill={isLiked ? "#FF6B1A" : "transparent"}
                    />
                    <Text
                      className={cn(
                        "font-geist-semibold text-[13px]",
                        isLiked
                          ? "text-brand"
                          : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {likes}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => void handleShare()}
                    accessibilityRole="button"
                    accessibilityLabel={t("listDetail.share")}
                    className="cursor-pointer flex-row items-center gap-1.5"
                    hitSlop={4}
                  >
                    <Share2 size={14} color={iconMuted} />
                    <Text className="font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400">
                      {offer.shares}
                    </Text>
                  </Pressable>

                  <View className="flex-1" />

                  <View className="max-w-[45%] flex-row items-center gap-1.5">
                    {isLessThanADay ? (
                      <Clock size={14} color="#de4f2d" />
                    ) : (
                      <Calendar size={14} color={iconMuted} />
                    )}
                    <Text
                      className={`font-geist-semibold text-[13px] ${
                        isLessThanADay
                          ? "text-[#de4f2d]"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                      numberOfLines={1}
                    >
                      {untilLabel || t("offers.noExpiration")}
                    </Text>
                  </View>
                </View>
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

      {myRedemption?.code && !myRedemption.used_at && offer ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -9999,
            top: 0,
            opacity: 0,
          }}
        >
          <RedeemQrShareCard
            ref={qrShareCardRef}
            code={myRedemption.code}
            offerTitle={offer.title || t("offers.detail.title")}
            businessName={offer.businessName}
            expiresLabel={untilLabel || null}
            redeemCodeLabel={t("offers.detail.yourCode")}
            showAtCounterLabel={t("offers.detail.showAtCounter")}
          />
        </View>
      ) : null}
    </>
  );
}
