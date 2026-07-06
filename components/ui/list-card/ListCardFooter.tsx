import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Pin,
} from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { formatListLocation } from "@/utils/listUi";

interface ListCardFooterProps {
  id: string;
  isDraft: boolean;
  disableActions: boolean;
  likeLoading: string | null;
  saveLoading: string | null;
  pinnedLoading: string | null;
  localLikedState: boolean;
  localSavedState: boolean;
  localPinnedState: boolean;
  localReactions: number;
  localSaves: number;
  comments: number;
  tagsLength: number;
  shares: number;
  isOwnList: boolean;
  location?: string;
  categories: string[];
  others_name?: string;
  forceShowPinIcon?: boolean;
  onLike: () => void;
  onSave: () => void;
  onPin: () => void;
}

export function ListCardFooter({
  id,
  isDraft,
  disableActions,
  likeLoading,
  saveLoading,
  pinnedLoading,
  localLikedState,
  localSavedState,
  localPinnedState,
  localReactions,
  localSaves,
  comments,
  tagsLength,
  shares,
  isOwnList,
  location,
  categories,
  others_name,
  forceShowPinIcon = false,
  onLike,
  onSave,
  onPin,
}: ListCardFooterProps) {
  const isLikeLoading = likeLoading === id;
  const isSaveLoading = saveLoading === id;
  const isPinLoading = pinnedLoading === id;

  return (
    <>
      {!isDraft ? (
        <View className="mb-2 shrink-0 border-t border-gray-200 pt-2 dark:border-gray-700">
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={onLike}
                disabled={disableActions || isLikeLoading}
                accessibilityRole="button"
                className="cursor-pointer flex-row items-center gap-1"
              >
                {isLikeLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Heart
                    size={14}
                    color={localLikedState ? "#FF5454" : "#999"}
                    fill={localLikedState ? "#FF5454" : "transparent"}
                  />
                )}
                <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                  {localReactions}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={onSave}
                disabled={disableActions || isSaveLoading || isOwnList}
                accessibilityRole="button"
                className="cursor-pointer flex-row items-center gap-1"
              >
                {isSaveLoading ? (
                  <ActivityIndicator size="small" color="#FF6B1A" />
                ) : (
                  <Bookmark
                    size={14}
                    color={localSavedState ? "#FF6B1A" : "#9CA3AF"}
                    fill={localSavedState ? "#FF6B1A" : "transparent"}
                  />
                )}
                <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                  {localSaves}
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-1">
              <MessageCircle size={14} color="#9CA3AF" />
              <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                {comments}
              </Text>
            </View>

            <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
              {tagsLength} picks
            </Text>

            {shares > 0 ? (
              <Text className="ml-auto font-geist text-xs text-gray-500 dark:text-gray-400">
                {shares} {shares !== 1 ? "shares" : "share"}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="mt-1.5 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          {location ? (
            <View className="max-w-full flex-row items-center gap-1">
              <MapPin size={12} color="#9CA3AF" />
              <Text
                className="font-geist text-xs text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
          ) : null}

          {categories.map((category) => (
            <Badge
              key={category}
              label={
                category.toLowerCase() === "others"
                  ? (others_name ?? category)
                  : category
              }
            />
          ))}
        </View>

        {(isOwnList || forceShowPinIcon) && !isDraft ? (
          <Pressable
            onPress={onPin}
            disabled={disableActions || forceShowPinIcon || isPinLoading}
            accessibilityRole="button"
            className="cursor-pointer ml-2 p-1 h-6"
          >
            {isPinLoading ? (
              <ActivityIndicator size="small" color="#FF6B1A" />
            ) : (
              <Pin
                size={16}
                color={localPinnedState ? "#FF6B1A" : "#6B7280"}
                fill={localPinnedState ? "#FF6B1A" : "transparent"}
              />
            )}
          </Pressable>
        ) : null}
      </View>
    </>
  );
}
