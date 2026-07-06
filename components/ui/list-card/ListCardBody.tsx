import { Image, Text, View } from "react-native";
import { ImageOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { getDominantPersonalityTextColor } from "@/utils/listUi";
import { resolveImageUrl } from "@/utils/httpHelpers";
import type { Item } from "@/http/list-api/types";

interface ListCardBodyProps {
  title: string;
  description: string;
  items?: Item[];
  personalityColor?: Record<string, number> | null;
}

export function ListCardBody({
  title,
  description,
  items = [],
  personalityColor,
}: ListCardBodyProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const pickNameColor = getDominantPersonalityTextColor(personalityColor);

  return (
    <View className="shrink-0">
      <Text
        className="my-2 font-geist-medium text-sm text-ink dark:text-gray-100"
        numberOfLines={2}
      >
        {title}
      </Text>

      {description ? (
        <Text
          className="mb-2 font-geist text-xs italic leading-4 text-gray-400"
          numberOfLines={2}
        >
          {description.replace(/<[^>]*>/g, "")}
        </Text>
      ) : null}

      {/* Picks List */}
      {items.length > 0 ? (
        <View className="gap-3 mb-2">
          {items.slice(0, 2).map((item) => {
            const name = item.business?.name || item.unverified_business?.name;
            if (!name) return null;

            const imageUrl =
              resolveImageUrl(item.images?.[0]?.url) ??
              resolveImageUrl(item.business?.logo);
            const visibleTags = item.tags.slice(0, 3);
            const extraTagCount = item.tags.length - visibleTags.length;

            return (
              <View key={item.id} className="flex-row gap-3">
                {/* Thumbnail */}
                <View className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <ImageOff size={20} color={colorScheme === "dark" ? "#4B5563" : "#D1D5DB"} />
                    </View>
                  )}
                </View>

                {/* Content */}
                <View className="min-w-0 flex-1 justify-center gap-0.5">
                  <Text
                    className="font-geist-medium text-xs text-ink dark:text-gray-100"
                    style={{ color: pickNameColor }}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>

                  {item.description ? (
                    <Text
                      className="font-geist text-xs text-gray-500 dark:text-gray-400"
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  ) : null}

                  {visibleTags.length > 0 ? (
                    <View className="flex-row items-center gap-1.5">
                      <Text
                        className="font-geist text-xs text-gray-400"
                        numberOfLines={1}
                      >
                        {visibleTags.map((t) => t.name).join(" · ")}
                      </Text>
                      {extraTagCount > 0 ? (
                        <View className="rounded-full bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">
                          <Text className="font-geist-medium text-xs text-gray-500 dark:text-gray-400">
                            +{extraTagCount}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
          {items.length > 2 ? (
            <Text className="pl-1 font-geist text-xs text-gray-400">
              {t("profile.lists.morePicks", { count: items.length - 2 })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
