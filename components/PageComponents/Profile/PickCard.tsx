import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BadgeCheck, Bookmark, List } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CardHero } from "@/components/ui/CardHero";
import { CardOptionsMenu } from "@/components/ui/CardOptionsMenu";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { PickDetailModal } from "./PickDetailModal";
import { PickFormModal } from "./PickFormModal";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getEmbeddedMatchPercent } from "@/utils/matchScore";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import type { ListItemImage, ListItemPublic } from "@/http/list-api/types";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { isOthersCategoryName } from "@/utils/listCategories";

const PICK_HERO_VISIBLE_TAGS = 3;

interface PickCardProps {
  data: ListItemPublic;
  onRefresh?: () => void;
  readOnly?: boolean;
}

function formatLocationLabel(location: ListItemPublic["location"]): string | null {
  if (!location) return null;
  return (
    [location.city, location.region].filter(Boolean).join(", ") ||
    location.country ||
    null
  );
}

function PickCardOwnerRow({ data }: { data: ListItemPublic }) {
  const { t } = useTranslation();

  if (!data.owner && data.list_usage_count <= 0) return null;

  return (
    <View className="flex-row items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
      {data.owner ? (
        <View className="flex-row items-center gap-1.5 min-w-0 flex-1">
          <Avatar
            name={data.owner.name}
            src={resolveImageUrl(data.owner.profile_image) ?? undefined}
            size="xs"
            userId={data.owner.id}
          />
          <Text
            className="text-xs text-gray-400 font-geist-medium flex-1"
            numberOfLines={1}
          >
            {data.owner.name}
          </Text>
        </View>
      ) : (
        <View />
      )}
      {data.list_usage_count > 0 && (
        <View className="flex-row items-center gap-1 shrink-0">
          <List size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400">{data.list_usage_count}</Text>
        </View>
      )}
    </View>
  );
}

interface PickCardBodyProps {
  data: ListItemPublic;
  thumbnails: ListItemImage[];
  locationLabel: string | null;
  padForMatchOverlay?: boolean;
}

function PickCardBody({
  data,
  thumbnails,
  locationLabel,
  padForMatchOverlay = false,
}: PickCardBodyProps) {
  const primaryImage = thumbnails[0];
  const heroImageUrl = primaryImage
    ? (resolveImageUrl(primaryImage.url) ?? primaryImage.url)
    : null;

  const visibleTags = data.tags.slice(0, PICK_HERO_VISIBLE_TAGS);
  const extraTagCount = data.tags.length - visibleTags.length;
  const tagsSubtitle =
    visibleTags.length > 0
      ? visibleTags.map((tag) => tag.name).join(" · ")
      : undefined;
  const showTitleInBody = !heroImageUrl && Boolean(data.business_name);
  const showTagsInBody = !heroImageUrl && data.tags.length > 0;

  return (
    <View className="w-full">
      {heroImageUrl ? (
        <CardHero
          imageUrl={heroImageUrl}
          title={data.business_name ?? ""}
          subtitle={tagsSubtitle}
          subtitleExtra={extraTagCount > 0 ? `+${extraTagCount}` : undefined}
          aspectClassName="aspect-[16/12] rounded-t-2xl"
          titleSize="text-2xl"
          subtitleSize="text-sm"
        />
      ) : null}

      <View className={!heroImageUrl && padForMatchOverlay ? "p-3 pt-10 gap-1" : "p-3 gap-1"}>
        {showTitleInBody ? (
          <View className="flex-row items-center gap-1.5">
            <Text
              className="text-sm font-geist-medium text-ink dark:text-gray-100 flex-1"
              numberOfLines={1}
            >
              {data.business_name}
            </Text>
            {data.is_verified && <BadgeCheck size={14} color="#FF6B1A" />}
          </View>
        ) : null}

        {locationLabel && (
          <Text className="text-xs text-gray-400 dark:text-gray-500" numberOfLines={1}>
            {locationLabel}
          </Text>
        )}

        {data.description ? (
          <Text
            className="font-geist text-xs italic leading-4 text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {data.description}
          </Text>
        ) : null}

        {data.categories.length > 0 && (
          <View className="flex-row flex-wrap items-center gap-1 mt-1">
            {data.categories.map((category) => (
              <Badge
                key={category}
                label={isOthersCategoryName(category) ? (data.others_name ?? category) : category}
                variant="secondary"
              />
            ))}
          </View>
        )}

        {showTagsInBody ? (
          <View className="flex-row flex-wrap items-center gap-1 mt-1">
            {data.tags.slice(0, 2).map((tag) => (
              <Badge key={tag.id} label={tag.name} variant="primary" />
            ))}
            {data.tags.length > 2 && (
              <Text className="text-xs text-blue-600 dark:text-blue-400 font-geist-medium">
                +{data.tags.length - 2}
              </Text>
            )}
          </View>
        ) : null}

        <PickCardOwnerRow data={data} />
      </View>
    </View>
  );
}

export function PickCard({
  data,
  onRefresh,
  readOnly = false,
}: PickCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const showToast = useToastStore((s) => s.show);
  const canManage = !readOnly && data.is_owner;
  const thumbnails = data.images ?? [];
  const locationLabel = formatLocationLabel(data.location);
  const personalityMatch = data.is_owner
    ? null
    : getEmbeddedMatchPercent(data.owner);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(data.is_favorite ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(data.is_favorite ?? false);
  }, [data.id, data.is_favorite]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error, data: response } = await listService.deleteListItem(data.id);
    setIsDeleting(false);

    if (error) {
      const body =
        (response as unknown as { lists?: { name: string }[]; message?: string }) ?? {};
      const listNames = body.lists?.map((l) => l.name).join(", ");
      showToast({
        type: "error",
        message: listNames
          ? t("profile.picks.deleteInUse", { lists: listNames })
          : (error.message ?? t("profile.picks.deleteError")),
      });
      setIsDeleteOpen(false);
      return;
    }

    setIsDeleteOpen(false);
    onRefresh?.();
  };

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

  const actionIconBackingStyle = {
    backgroundColor: colorScheme === "dark" ? "rgba(17,24,39,0.8)" : "rgba(255,255,255,0.9)",
  };

  return (
    <>
      <WhiteBox className="p-0">
        <Pressable onPress={() => setIsDetailOpen(true)} className="cursor-pointer">
          <PickCardBody
            data={data}
            thumbnails={thumbnails}
            locationLabel={locationLabel}
            padForMatchOverlay={
              personalityMatch != null && personalityMatch > 0
            }
          />
        </Pressable>

        <View className="absolute left-2 top-2 z-10" pointerEvents="none">
          <PersonalityMatchPill
            variant="overlayCompact"
            percent={personalityMatch}
          />
        </View>

        <View className="absolute right-2 top-2 flex-row items-center gap-1">
          {!canManage && (
            <Pressable
              onPress={() => void handleToggleFavorite()}
              disabled={isTogglingFavorite}
              className="rounded-full p-1.5 cursor-pointer"
              style={actionIconBackingStyle}
            >
              <Bookmark
                size={14}
                color={isFavorite ? "#EF4444" : "#374151"}
                fill={isFavorite ? "#EF4444" : "transparent"}
              />
            </Pressable>
          )}
          {canManage && (
            <View className="rounded-full" style={actionIconBackingStyle}>
              <CardOptionsMenu
                onPin={() => void handleToggleFavorite()}
                pinIcon={Bookmark}
                onEdit={() => setIsEditOpen(true)}
                onDelete={() => setIsDeleteOpen(true)}
                isDeleting={isDeleting}
              />
            </View>
          )}
        </View>
      </WhiteBox>

      <PickDetailModal
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={data}
      />

      {canManage && (
        <>
          <PickFormModal
            visible={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onCreated={() => {}}
            editingItem={data}
            onUpdated={() => {
              setIsEditOpen(false);
              onRefresh?.();
            }}
          />

          <ConfirmDeleteModal
            visible={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={() => void handleDelete()}
            isLoading={isDeleting}
            title={t("profile.picks.deletePickTitle")}
            message={t("profile.picks.deletePickMessage")}
          />
        </>
      )}
    </>
  );
}
