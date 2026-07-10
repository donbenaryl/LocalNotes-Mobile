import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { useDraftSuggestedPicks } from "@/hooks/useDraftSuggestedPicks";
import { useHomeLocationLabel } from "@/hooks/useHomeLocationLabel";
import { useListFormStore } from "@/stores/useListFormStore";
import { mapListItemPublicToPickTag } from "@/utils/listPickMappers";
import { resolveImageUrl } from "@/utils/httpHelpers";

export function DraftsSmartSuggestion() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const { picks, shouldShow } = useDraftSuggestedPicks();
  const { cityLabel, isLoading: isLocationLoading } = useHomeLocationLabel();

  if (isDismissed || !shouldShow || isLocationLoading) return null;

  const thumbnails = picks.slice(0, 4);

  const handleMakeList = () => {
    const { reset, setItems } = useListFormStore.getState();
    reset();
    setItems(picks.map(mapListItemPublicToPickTag));
    router.push("/(app)/(stack)/lists/new" as never);
  };

  return (
    <WhiteBox className="mb-4 border-brand/20 bg-orange-50 dark:bg-gray-800">
      <Text className="mb-1 font-geist-bold text-[10px] uppercase tracking-widest text-brand">
        {t("saved.drafts.smartSuggestEyebrow")}
      </Text>
      <Text className="mb-1 font-geist-semibold text-base text-ink dark:text-gray-100">
        {t("saved.drafts.smartSuggestTitle", { count: picks.length, location: cityLabel })}
      </Text>
      <Text className="mb-3 font-geist text-sm text-gray-500 dark:text-gray-400">
        {t("saved.drafts.smartSuggestDetail")}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {thumbnails.map((pick, index) => (
            <Image
              key={pick.id}
              source={{ uri: resolveImageUrl(pick.images[0]?.url) ?? undefined }}
              className={`h-10 w-10 rounded-lg border-2 border-white dark:border-gray-800 ${index > 0 ? "-ml-2" : ""}`}
            />
          ))}
        </View>

        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => setIsDismissed(true)} className="cursor-pointer">
            <Text className="font-geist-medium text-sm text-gray-500 dark:text-gray-400">
              {t("saved.drafts.notNow")}
            </Text>
          </Pressable>
          <Pressable onPress={handleMakeList} className="cursor-pointer">
            <Text className="font-geist-semibold text-sm text-brand">
              {t("saved.drafts.makeList")}
            </Text>
          </Pressable>
        </View>
      </View>
    </WhiteBox>
  );
}
