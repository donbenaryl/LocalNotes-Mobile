import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Bookmark, MapPin, BadgeCheck, List } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { ImageFullScreen } from "@/components/ui/ImageFullScreen";
import { PickCardOwner } from "./PickCardOwner";
import { resolveImageUrl } from "@/utils/httpHelpers";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import type { ListItemPublic } from "@/http/list-api/types";
import { isOthersCategoryName } from "@/utils/listCategories";

interface PickDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data: ListItemPublic;
}

export function PickDetailModal({ visible, onClose, data }: PickDetailModalProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const showToast = useToastStore((s) => s.show);
  const [isFavorite, setIsFavorite] = useState(data.is_favorite ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isImageFullScreenVisible, setIsImageFullScreenVisible] =
    useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    setIsFavorite(data.is_favorite ?? false);
  }, [data.id, data.is_favorite]);

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setIsTogglingFavorite(true);
    const { error } = await listService.setListItemFavorite(data.id, nextFavorite);
    setIsTogglingFavorite(false);

    if (error) {
      setIsFavorite(!nextFavorite);
      showToast({ type: "error", message: error.message ?? t("profile.picks.favoriteError") });
    }
  };

  const title = data.business_name?.trim() || t("profile.picks.untitled");
  const locationLabel = data.location
    ? [data.location.city, data.location.region, data.location.country].filter(Boolean).join(", ")
    : null;

  const isImageViewerOpen =
    isImageFullScreenVisible && Boolean(selectedImageUri);

  return (
    <>
      <Modal
        visible={visible && !isImageViewerOpen}
        onClose={onClose}
        title={title}
        position="bottom"
      >
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.65 }}>
        <View className="gap-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 flex-1">
              {data.is_verified && <BadgeCheck size={18} color="#FF6B1A" />}
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {data.is_verified ? t("profile.picks.verified") : t("profile.picks.pickDetails")}
              </Text>
            </View>
            <Pressable
              onPress={() => void handleToggleFavorite()}
              disabled={isTogglingFavorite}
              className="p-2 cursor-pointer"
            >
              <Bookmark
                size={20}
                color={isFavorite ? "#EF4444" : "#374151"}
                fill={isFavorite ? "#EF4444" : "transparent"}
              />
            </Pressable>
          </View>

          {data.images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-row gap-2"
            >
              {data.images.map((img) => {
                const imageUri = resolveImageUrl(img.url) ?? img.url;

                return (
                  <Pressable
                    key={img.id}
                    onPress={() => {
                      setSelectedImageUri(imageUri);
                      setIsImageFullScreenVisible(true);
                    }}
                    accessibilityRole="imagebutton"
                    className="h-32 w-32 cursor-pointer overflow-hidden rounded-xl"
                  >
                    <View pointerEvents="none" className="h-full w-full">
                      <Image
                        source={{ uri: imageUri }}
                        className="h-full w-full"
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {data.description ? (
            <Text className="font-geist text-sm text-gray-700 dark:text-gray-300">
              {data.description}
            </Text>
          ) : null}

          {data.categories.length > 0 && (
            <View className="flex-row flex-wrap gap-1">
              {data.categories.map((category) => (
                <Badge
                  key={category}
                  label={isOthersCategoryName(category) ? (data.others_name ?? category) : category}
                  variant="secondary"
                />
              ))}
            </View>
          )}

          {data.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1">
              {data.tags.map((tag) => (
                <Badge key={tag.id} label={tag.name} variant="primary" />
              ))}
            </View>
          )}

          {locationLabel && (
            <View className="flex-row items-center gap-1.5">
              <MapPin size={14} color="#9CA3AF" />
              <Text className="text-sm text-gray-500 dark:text-gray-400">{locationLabel}</Text>
            </View>
          )}

          {data.list_usage_count > 0 && (
            <View className="flex-row items-center gap-1.5">
              <List size={14} color="#9CA3AF" />
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {data.list_usage_count}{" "}
                {data.list_usage_count === 1 ? t("profile.picks.list") : t("profile.picks.lists")}
              </Text>
            </View>
          )}

          {/* {data.owner && <PickCardOwner owner={data.owner} />} */}
        </View>
      </ScrollView>
    </Modal>

      <ImageFullScreen
        uri={selectedImageUri ?? ''}
        visible={isImageViewerOpen}
        onClose={() => {
          setIsImageFullScreenVisible(false);
          setSelectedImageUri(null);
        }}
      />
    </>
  );
}
