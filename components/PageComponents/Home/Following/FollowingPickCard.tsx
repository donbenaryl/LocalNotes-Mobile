import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import { NoImage } from "@/components/ui/NoImage";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import type { ActivityPickData } from "@/http/home-api/type";
import listService from "@/http/list-api/list.service";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getEmbeddedMatchPercent } from "@/utils/matchScore";
import { getDominantPersonalityColor } from "@/utils/personalityRing";
import {
  formatCategoryCity,
  formatCityRegion,
  isActivityPickData,
  type PickActivity,
} from "@/utils/followingFeed";
import { FollowingActivityHeader } from "./FollowingActivityHeader";
import { FollowingBookmarkButton } from "./FollowingBookmarkButton";
import { FollowingUnavailableCard } from "./FollowingUnavailableCard";

interface FollowingPickCardProps {
  item: PickActivity;
}

interface FollowingPickCardContentProps {
  item: PickActivity;
  pick: ActivityPickData;
}

function usePickFavorite(pickId: string, initialFavorite: boolean) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [pickId, initialFavorite]);

  const toggle = useCallback(async () => {
    if (isToggling) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setIsToggling(true);
    const { error } = await listService.setListItemFavorite(pickId, next);
    setIsToggling(false);
    if (error) {
      console.error("Failed to toggle pick favorite:", error);
      setIsFavorite(!next);
    }
  }, [isFavorite, isToggling, pickId]);

  return { isFavorite, isToggling, toggle };
}

export function FollowingPickCard({ item }: FollowingPickCardProps) {
  const { t } = useTranslation();
  const fullPick = isActivityPickData(item) ? item.data : null;
  const pickId = item.data.id;
  const storedName = item.data.name;

  const { data: fetchedPick, isPending } = useQuery({
    queryKey: ["list-item", pickId],
    enabled: !fullPick && Boolean(pickId),
    retry: 1,
    queryFn: async (): Promise<ActivityPickData | null> => {
      const response = await listService.fetchListItem(pickId);
      if (response.error) throw response.error;
      const data = response.data?.data;
      return data ? { ...data, name: data.business_name ?? storedName } : null;
    },
  });

  const pick = fullPick ?? fetchedPick;
  if (pick) return <FollowingPickCardContent item={item} pick={pick} />;

  return (
    <FollowingUnavailableCard
      account={item.account}
      actionText={t(`home.following.activity.pick.${item.action}`, {
        defaultValue: t("home.following.activity.fallback"),
      })}
      name={storedName}
      isLoading={isPending}
      message={t("home.following.unavailablePick")}
    />
  );
}

function FollowingPickCardContent({ item, pick }: FollowingPickCardContentProps) {
  const { t } = useTranslation();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { isFavorite, isToggling, toggle } = usePickFavorite(pick.id, pick.is_favorite);

  const placeName = pick.business_name ?? pick.name;
  const imageUrl = resolveImageUrl(pick.images?.[0]?.url);
  const owner = pick.owner ?? item.account;
  const personalityColor = owner.personality_color ?? item.account.personality_color;
  const matchPercent = getEmbeddedMatchPercent(owner);
  const subtitle = formatCategoryCity(pick.categories, pick.location);

  return (
    <View className="gap-3">
      <FollowingActivityHeader
        account={item.account}
        actionText={t(`home.following.activity.pick.${item.action}`, {
          defaultValue: t("home.following.activity.fallback"),
        })}
        locationLabel={formatCityRegion(pick.location)}
        right={
          pick.is_owner ? null : (
            <FollowingBookmarkButton
              active={isFavorite}
              disabled={isToggling}
              onPress={() => void toggle()}
              accessibilityLabel={t("home.following.favoritePickLabel", { name: placeName })}
            />
          )
        }
      />

      <Pressable
        onPress={() => setIsDetailOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={placeName}
        className="cursor-pointer flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-soft dark:border-gray-700 dark:bg-gray-800/60 p-3"
      >
        {imageUrl ? (
          <View className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
            <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
          </View>
        ) : (
          <NoImage 
            appearance="flat"
            size="xs"
            outerClassName="dark:!bg-white/40"
          />
        )}

        <View className="min-w-0 flex-1 gap-0.5">
          <Text
            className="font-geist-semibold text-sm text-ink dark:text-gray-100"
            numberOfLines={1}
          >
            {placeName}
          </Text>
          {subtitle ? (
            <Text
              className="font-geist text-xs"
              style={{ color: getDominantPersonalityColor(personalityColor) }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {matchPercent != null && !pick.is_owner ? (
          <PersonalityMatchPill percent={matchPercent} size="md" />
        ) : null}
      </Pressable>

      {isDetailOpen ? (
        <PickDetailModal
          visible={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          data={pick}
        />
      ) : null}
    </View>
  );
}
