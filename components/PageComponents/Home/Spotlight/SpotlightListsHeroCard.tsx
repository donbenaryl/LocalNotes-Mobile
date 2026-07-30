import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowUp, Bookmark } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSpotlightImageFallback } from "@/hooks/useSpotlightImageFallback";
import { useSpotlightImpressionTracking } from "@/hooks/useSpotlightImpressionTracking";
import { useSpotlightListSave } from "@/hooks/useSpotlightListSave";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import { resolveImageUrl } from "@/utils/httpHelpers";
import type { SpotlightListEntityDAO } from "@/http/spotlight-api/type";
import { SpotlightFallbackGradient } from "./SpotlightFallbackGradient";

interface SpotlightListsHeroCardProps {
  list: SpotlightListEntityDAO;
}

const FALLBACK_GRADIENT_COLORS = ["#2A2438", "#8A6BA0"] as const;
const GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

export function SpotlightListsHeroCard({ list }: SpotlightListsHeroCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const imageUrl = resolveImageUrl(list.image);
  const { showFallback, onError } = useSpotlightImageFallback(imageUrl);
  const { isSaved, saveCount, isSaving, toggle } = useSpotlightListSave(
    list.id,
    list.save_count,
    list.spotlight_item_id,
  );
  const impressionRef = useSpotlightImpressionTracking(list.spotlight_item_id);

  const handleOpen = () => {
    if (list.spotlight_item_id) {
      void spotlightService.logOpenEvent(list.spotlight_item_id);
    }
    router.push(`/lists/${list.id}` as never);
  };

  return (
    <Pressable
      ref={impressionRef}
      onPress={handleOpen}
      className="relative mt-2.5 h-[136px] overflow-hidden rounded-[18px]"
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
        onPress={() => void toggle()}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel={t("spotlight.sections.lists.saveLabel", { title: list.title })}
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

      <View className="absolute bottom-[11px] left-3.5 right-[52px]">
        <Text className="font-geist-semibold text-xl text-white capitalize" numberOfLines={3}>
          {list.title}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1">
          <Text className="text-md text-white/85" numberOfLines={1}>
            {list.curator_name}
          </Text>
          <Text className="text-md text-white/85">·</Text>
          <ArrowUp size={11} color="rgba(255,255,255,0.85)" />
          <Text className="text-md text-white/85">
            {t("spotlight.sections.lists.savesCount", { count: saveCount })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
