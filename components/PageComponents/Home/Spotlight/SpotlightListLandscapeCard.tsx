import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { useSpotlightImageFallback } from "@/hooks/useSpotlightImageFallback";
import { useSpotlightImpressionTracking } from "@/hooks/useSpotlightImpressionTracking";
import { useSpotlightListSave } from "@/hooks/useSpotlightListSave";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getListMatchPercent } from "@/utils/matchScore";
import type { SpotlightListEntityDAO } from "@/http/spotlight-api/type";
import { SpotlightFallbackGradient } from "./SpotlightFallbackGradient";

interface SpotlightListLandscapeCardProps {
  list: SpotlightListEntityDAO;
  onPressList: (id: string) => void;
}

const FALLBACK_GRADIENT_COLORS = ["#2A2438", "#8A6BA0"] as const;
const GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

export function SpotlightListLandscapeCard({
  list,
  onPressList,
}: SpotlightListLandscapeCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveImageUrl(list.image);
  const { showFallback, onError } = useSpotlightImageFallback(imageUrl);
  const { isSaved, saveCount, isSaving, toggle } = useSpotlightListSave(
    list.id,
    list.save_count,
    list.spotlight_item_id,
  );
  const impressionRef = useSpotlightImpressionTracking(list.spotlight_item_id);
  const personalityMatch = getListMatchPercent(list);

  const handleOpen = () => {
    if (list.spotlight_item_id) {
      void spotlightService.logOpenEvent(list.spotlight_item_id);
    }
    onPressList(list.id);
  };

  return (
    <Pressable
      ref={impressionRef}
      onPress={handleOpen}
      role="listitem"
      className="relative h-[122px] w-[208px] overflow-hidden rounded-2xl"
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

      <View className="absolute left-2 top-2">
        <PersonalityMatchPill variant="overlay" percent={personalityMatch} />
      </View>

      <View className="absolute bottom-2.5 left-3 right-3">
        <Text className="font-geist-semibold text-xl text-white capitalize" numberOfLines={2}>
          {list.title}
        </Text>
        <Text className="mt-0.5 text-md text-white/85" numberOfLines={1}>
          {list.curator_name} · {t("spotlight.sections.lists.savesCount", { count: saveCount })}
        </Text>
      </View>
    </Pressable>
  );
}
