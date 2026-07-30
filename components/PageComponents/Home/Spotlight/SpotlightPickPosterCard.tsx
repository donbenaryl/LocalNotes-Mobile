import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import { useSpotlightImageFallback } from "@/hooks/useSpotlightImageFallback";
import { useSpotlightImpressionTracking } from "@/hooks/useSpotlightImpressionTracking";
import listService from "@/http/list-api/list.service";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import { resolveImageUrl } from "@/utils/httpHelpers";
import type { ListItemPublic } from "@/http/list-api/types";
import type { SpotlightPickEntityDAO } from "@/http/spotlight-api/type";
import { SpotlightFallbackGradient } from "./SpotlightFallbackGradient";

interface SpotlightPickPosterCardProps {
  pick: SpotlightPickEntityDAO;
}

const FALLBACK_GRADIENT_COLORS = ["#4A3320", "#B8804A"] as const;
const GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function mapSpotlightPickToListItemPublic(
  pick: SpotlightPickEntityDAO,
  isFavorite: boolean,
): ListItemPublic {
  return {
    id: pick.id,
    business_name: pick.title,
    business_id: null,
    is_verified: false,
    is_favorite: isFavorite,
    is_owner: false,
    owner: {
      id: pick.curator_id,
      name: pick.curator_name,
      profile_image: null,
    },
    description: pick.quote ?? "",
    tags: [],
    categories: [],
    images: pick.image ? [{ id: `spotlight-${pick.id}`, url: pick.image }] : [],
    list_usage_count: pick.featured_in_lists_count,
    location: null,
  };
}

export function SpotlightPickPosterCard({ pick }: SpotlightPickPosterCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveImageUrl(pick.image);
  const { showFallback, onError } = useSpotlightImageFallback(imageUrl);
  const impressionRef = useSpotlightImpressionTracking(pick.spotlight_item_id);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<ListItemPublic | null>(null);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const previousSaved = isSaved;
    const nextSaved = !previousSaved;
    setIsSaved(nextSaved);

    try {
      await listService.setListItemFavorite(pick.id, nextSaved);
      if (nextSaved && pick.spotlight_item_id) {
        void spotlightService.logSaveEvent(pick.spotlight_item_id);
      }
    } catch (error) {
      console.error("Failed to toggle Spotlight pick save:", error);
      setIsSaved(previousSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpen = async () => {
    if (isOpening) return;
    setIsOpening(true);

    if (pick.spotlight_item_id) {
      void spotlightService.logOpenEvent(pick.spotlight_item_id);
    }

    try {
      const response = await listService.fetchListItem(pick.id);
      if (response.error || !response.data?.data) {
        throw new Error(response.error?.message ?? "Pick not found");
      }
      setDetailData(response.data.data);
      setIsDetailOpen(true);
    } catch (error) {
      console.error("Failed to load Spotlight pick details:", error);
      setDetailData(mapSpotlightPickToListItemPublic(pick, isSaved));
      setIsDetailOpen(true);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <>
      <Pressable
        ref={impressionRef}
        onPress={() => void handleOpen()}
        disabled={isOpening}
        role="listitem"
        className="relative h-[216px] w-[168px] overflow-hidden rounded-2xl"
      >
        {showFallback ? (
          <SpotlightFallbackGradient colors={FALLBACK_GRADIENT_COLORS} />
        ) : (
          <Image
            source={{ uri: imageUrl as string }}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
            onError={onError}
          />
        )}

        <LinearGradient
          colors={["rgba(10,7,4,0.9)", "rgba(10,7,4,0.35)", "rgba(10,7,4,0.08)"]}
          locations={[0.18, 0.55, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={GRADIENT_FILL}
        />

        <Pressable
          onPress={() => void handleSave()}
          disabled={isSaving}
          accessibilityRole="button"
          aria-label={t("spotlight.sections.picks.saveLabel", { title: pick.title })}
          className="absolute right-0.5 top-0.5 h-11 w-11 items-center justify-center"
        >
          <View className="h-8 w-8 items-center justify-center rounded-full bg-white/95">
            <Bookmark
              size={15}
              color={isSaved ? "#FF6B1A" : "#141413"}
              fill={isSaved ? "#FF6B1A" : "transparent"}
            />
          </View>
        </Pressable>

        <View className="absolute bottom-2.5 left-[11px] right-[11px]">
          <Text className="font-geist-semibold text-xl text-white capitalize" numberOfLines={1}>
            {pick.title}
          </Text>

          <View className="mt-1 flex-row items-center gap-1.5">
            <Avatar name={pick.curator_name} userId={pick.curator_id} size="xs" />
            <Text
              className="flex-1 font-geist-semibold text-sm text-white/90"
              numberOfLines={1}
            >
              {t("spotlight.pickedBy", { name: pick.curator_name })}
            </Text>
          </View>

          {pick.quote ? (
            <Text
              className="mt-[3px] text-sm italic leading-[15px] text-[#FFCFA8]"
              numberOfLines={2}
            >
              &ldquo;{pick.quote}&rdquo;
            </Text>
          ) : null}

          <Text className="mt-[3px] text-sm text-white/80" numberOfLines={1}>
            {t("spotlight.featuredInLists", { count: pick.featured_in_lists_count })}
          </Text>
        </View>

        {isOpening ? (
          <View
            className="absolute inset-0 items-center justify-center bg-black/45"
            accessibilityRole="progressbar"
            accessibilityLabel={t("spotlight.sections.picks.loadingLabel")}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>

      {detailData ? (
        <PickDetailModal
          visible={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          data={detailData}
        />
      ) : null}
    </>
  );
}
