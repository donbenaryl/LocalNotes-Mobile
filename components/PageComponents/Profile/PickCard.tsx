import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  BadgeCheck,
  Bookmark,
  Images,
  List,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CardOptionsMenu } from "@/components/ui/CardOptionsMenu";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { PickDetailModal } from "./PickDetailModal";
import { PickFormModal } from "./PickFormModal";
import { resolveImageUrl } from "@/utils/httpHelpers";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import type { ListItemImage, ListItemPublic } from "@/http/list-api/types";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { NoImage } from "@/components/ui/NoImage";
import { isOthersCategoryName } from "@/utils/listCategories";

interface PickCardProps {
  data: ListItemPublic;
  onRefresh?: () => void;
  readOnly?: boolean;
  variant?: "list" | "grid";
}

function formatLocationLabel(location: ListItemPublic["location"]): string | null {
  if (!location) return null;
  return (
    [location.city, location.region].filter(Boolean).join(", ") ||
    location.country ||
    null
  );
}

function PickCardOwnerRow({
  data,
  compact = false,
}: {
  data: ListItemPublic;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  if (!data.owner && data.list_usage_count <= 0) return null;

  return (
    <View
      className={`flex-row items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-700 ${compact ? "mt-2 pt-2" : "mt-3 pt-3"}`}
    >
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
          {!compact && (
            <Text className="text-xs text-gray-400">
              {data.list_usage_count}{" "}
              {data.list_usage_count === 1
                ? t("profile.picks.list")
                : t("profile.picks.lists")}
            </Text>
          )}
          {compact && <Text className="text-xs text-gray-400">{data.list_usage_count}</Text>}
        </View>
      )}
    </View>
  );
}

interface PickCardListLayoutProps {
  data: ListItemPublic;
  thumbnails: ListItemImage[];
  locationLabel: string | null;
}

function PickCardListLayout({ data, thumbnails, locationLabel }: PickCardListLayoutProps) {
  const primaryImage = thumbnails[0];
  const extraCount = thumbnails.length - 1;

  return (
    <View className="min-h-28">
      {/* List Image */}
      <View className="absolute left-0 top-0 bottom-0 w-36 overflow-hidden">
        {primaryImage ? (
          <>
            <Image
              source={{ uri: resolveImageUrl(primaryImage.url) ?? primaryImage.url }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {extraCount > 0 && (
              <View className="absolute bottom-2 right-2 z-40 flex-row items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5">
                <Images size={10} color="#FFFFFF" />
                <Text className="text-[10px] font-geist-medium text-white">
                  +{extraCount}
                </Text>
              </View>
            )}
          </>
        ) : (
          <NoImage
            personalityColor={data.owner?.personality_color}
            size="full"
            appearance="flat"
            innerClassName="border-t border-gray-100 dark:border-t-0"
          />
        )}
      </View>

      <View className="pl-40 pr-16 pt-4">
        {data.business_name && (
          <View className="flex-row items-center gap-1.5 mb-1">
            <Text
              className="text-sm font-geist-medium text-ink dark:text-gray-100 flex-1"
              numberOfLines={1}
            >
              {data.business_name}
            </Text>
            {data.is_verified && <BadgeCheck size={14} color="#FF6B1A" />}
          </View>
        )}

        {locationLabel && (
          <Text
            className="text-xs text-gray-400 dark:text-gray-500 mb-1"
            numberOfLines={1}
          >
            {locationLabel}
          </Text>
        )}

        {data.description ? (
          <Text
            className="font-geist text-xs italic leading-4 text-gray-500 dark:text-gray-400"
            numberOfLines={2}
          >
            {data.description}
          </Text>
        ) : null}

        {data.categories.length > 0 && (
          <View className="flex-row flex-wrap items-center gap-1 mt-2">
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
          <View className="flex-row flex-wrap items-center gap-1 mt-2">
            {data.tags.slice(0, 2).map((tag) => (
              <Badge key={tag.id} label={tag.name} variant="primary" />
            ))}
            {data.tags.length > 2 && (
              <Text className="text-xs text-blue-600 dark:text-blue-400 font-geist-medium">
                +{data.tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>

      <View className="pl-40 pr-4 pb-4">
        <PickCardOwnerRow data={data} />
      </View>
    </View>
  );
}

interface PickCardGridLayoutProps {
  data: ListItemPublic;
  thumbnails: ListItemImage[];
  locationLabel: string | null;
}

function PickCardGridLayout({ data, thumbnails, locationLabel }: PickCardGridLayoutProps) {
  const primaryImage = thumbnails[0];

  return (
    <View className="w-full">
      {primaryImage ? (
        <Image
          source={{ uri: resolveImageUrl(primaryImage.url) ?? primaryImage.url }}
          className="w-full aspect-[16/12] rounded-t-2xl"
          resizeMode="cover"
        />
      ) : (
        <NoImage
          personalityColor={data.owner?.personality_color}
          size="lg"
          appearance="flat"
          outerClassName="!aspect-[16/12]"
        />
      )}

      <View className="p-3 gap-1">
        {data.business_name && (
          <View className="flex-row items-center gap-1.5">
            <Text
              className="text-sm font-geist-medium text-ink dark:text-gray-100 flex-1"
              numberOfLines={1}
            >
              {data.business_name}
            </Text>
            {data.is_verified && <BadgeCheck size={14} color="#FF6B1A" />}
          </View>
        )}

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

        {data.tags.length > 0 && (
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
        )}

        <PickCardOwnerRow data={data} compact />
      </View>
    </View>
  );
}

export function PickCard({
  data,
  onRefresh,
  readOnly = false,
  variant = "list",
}: PickCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const showToast = useToastStore((s) => s.show);
  const canManage = !readOnly && data.is_owner;
  const thumbnails = data.images ?? [];
  const locationLabel = formatLocationLabel(data.location);

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

  const isGrid = variant === "grid";
  const actionIconSize = isGrid ? 14 : 16;
  const actionIconClassName = isGrid ? "rounded-full p-1.5 cursor-pointer" : "p-1.5 cursor-pointer";
  const actionIconBackingStyle = isGrid
    ? { backgroundColor: colorScheme === "dark" ? "rgba(17,24,39,0.8)" : "rgba(255,255,255,0.9)" }
    : undefined;

  return (
    <>
      <WhiteBox className={`p-0 ${!isGrid ? "rounded-none border-0 border-b border-gray-200 dark:border-gray-700" : ""}`}>
        <Pressable onPress={() => setIsDetailOpen(true)} className="cursor-pointer">
          {isGrid ? (
            <PickCardGridLayout
              data={data}
              thumbnails={thumbnails}
              locationLabel={locationLabel}
            />
          ) : (
            <PickCardListLayout
              data={data}
              thumbnails={thumbnails}
              locationLabel={locationLabel}
            />
          )}
        </Pressable>

        <View
          className={
            isGrid
              ? "absolute right-2 top-2 flex-row items-center gap-1"
              : "absolute right-3 top-3 flex-row items-center gap-1"
          }
        >
          {/* Action menu */}
          {!canManage && (
            <Pressable
              onPress={() => void handleToggleFavorite()}
              disabled={isTogglingFavorite}
              className={actionIconClassName}
              style={actionIconBackingStyle}
            >
              <Bookmark
                size={actionIconSize}
                color={isFavorite ? "#EF4444" : "#374151"}
                fill={isFavorite ? "#EF4444" : "transparent"}
              />
            </Pressable>
          )}
          {canManage && (
            <View className={isGrid ? "rounded-full" : undefined} style={actionIconBackingStyle}>
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
