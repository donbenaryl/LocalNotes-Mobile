import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import { mapItemToListItemPublic } from "@/components/ui/ListCardDetailed";
import { ListDetailModal } from "@/components/ui/ListDetailModal";
import { ListPickSection } from "@/components/ui/ListPickSection";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import type { ActivityItemDAO, ActivityListData } from "@/http/home-api/type";
import listService from "@/http/list-api/list.service";
import type { Item, ListItemPublic } from "@/http/list-api/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { clampPercent, getListMatchPercent } from "@/utils/matchScore";
import { formatCityRegion, getItemImageUrl } from "@/utils/followingFeed";
import { formatRelativeTime } from "@/utils/time";
import { FollowingActivityHeader } from "./FollowingActivityHeader";
import { FollowingBookmarkButton } from "./FollowingBookmarkButton";

interface FollowingListCardProps {
  item: ActivityItemDAO & { entity: "list"; data: ActivityListData };
}

const HERO_GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function useListBookmark(listId: string, initialSaved: boolean) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [listId, initialSaved]);

  const toggle = useCallback(async () => {
    if (isSaving) return;
    const previous = isSaved;
    setIsSaved(!previous);
    setIsSaving(true);
    try {
      const { error } = await listService.saveUnsaveList(listId);
      if (error) throw error;
    } catch (error) {
      console.error("Failed to toggle list save:", error);
      setIsSaved(previous);
    } finally {
      setIsSaving(false);
    }
  }, [isSaved, isSaving, listId]);

  return { isSaved, isSaving, toggle };
}

export function FollowingListCard({ item }: FollowingListCardProps) {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const list = item.data;
  const isOwnList = currentUserId === list.account?.id;
  const { isSaved, isSaving, toggle } = useListBookmark(list.id, list.is_saved);

  const [selectedPick, setSelectedPick] = useState<ListItemPublic | null>(null);
  const [isPickDetailOpen, setIsPickDetailOpen] = useState(false);

  const firstPick = list.items[0];
  const heroImageUrl =
    resolveImageUrl(list.image_url) ?? (firstPick ? getItemImageUrl(firstPick) : null);
  const categoriesLabel = list.categories.join(" · ");
  const matchPercent =
    list.similarity != null ? clampPercent(list.similarity) : getListMatchPercent(list);
  const personalityColor = list.personality_color ?? item.account.personality_color;

  const handlePickPress = useCallback(
    (pick: Item) => {
      setSelectedPick(mapItemToListItemPublic(pick, list, isOwnList));
      setIsPickDetailOpen(true);
    },
    [list, isOwnList],
  );

  return (
    <View className="gap-3">
      <FollowingActivityHeader
        account={item.account}
        actionText={t(`home.following.activity.list.${item.action}`, {
          defaultValue: t("home.following.activity.fallback"),
        })}
        locationLabel={formatCityRegion(list.location)}
        right={
          isOwnList ? null : (
            <FollowingBookmarkButton
              active={isSaved}
              disabled={isSaving}
              onPress={() => void toggle()}
              accessibilityLabel={t("home.following.saveListLabel", { name: list.name })}
            />
          )
        }
      />

      <View className="overflow-hidden rounded-2xl border border-gray-200 bg-soft dark:border-gray-700 dark:bg-gray-800/60">
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={list.name}
          className="cursor-pointer"
        >
          {heroImageUrl ? (
            <View className="h-28 justify-end px-3 pb-2.5">
              <Image
                source={{ uri: heroImageUrl }}
                className="absolute inset-0 h-full w-full"
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(10,7,4,0.85)", "rgba(10,7,4,0.35)", "rgba(10,7,4,0.05)"]}
                locations={[0, 0.6, 1]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={HERO_GRADIENT_FILL}
              />
              <Text className="font-geist-semibold text-xl text-white" numberOfLines={1}>
                {list.name}
              </Text>
              {categoriesLabel ? (
                <Text className="mt-0.5 font-geist text-xs text-white/85" numberOfLines={1}>
                  {categoriesLabel}
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="px-3 pt-3">
              <Text
                className="font-geist-semibold text-lg text-ink dark:text-gray-100"
                numberOfLines={2}
              >
                {list.name}
              </Text>
              {categoriesLabel ? (
                <Text
                  className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                >
                  {categoriesLabel}
                </Text>
              ) : null}
            </View>
          )}
        </Pressable>

        <ListPickSection
          items={list.items}
          listId={list.id}
          personalityColor={personalityColor}
          fallbackCity={list.location?.city}
          onPickPress={handlePickPress}
          className="mx-2.5 mt-2.5 border border-gray-200 dark:border-gray-800/60"
        />

        <View className="flex-row items-center justify-between px-3 pb-3 pt-2.5">
          <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
            {formatRelativeTime(item.created_at)}
          </Text>
          {matchPercent != null && !isOwnList ? (
            <PersonalityMatchPill percent={matchPercent} size="md" />
          ) : null}
        </View>
      </View>

      <ListDetailModal
        visible={isModalVisible}
        listId={list.id}
        onClose={() => setIsModalVisible(false)}
      />

      {selectedPick ? (
        <PickDetailModal
          visible={isPickDetailOpen}
          onClose={() => setIsPickDetailOpen(false)}
          data={selectedPick}
        />
      ) : null}
    </View>
  );
}
