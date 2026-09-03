import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { BadgeCheck, Bookmark, List } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CardHero } from "@/components/ui/CardHero";
import { CardOptionsMenu } from "@/components/ui/CardOptionsMenu";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { ReportFlagButton } from "@/components/PageComponents/Safety/ReportFlagButton";
import { PickDetailModal } from "./PickDetailModal";
import { PickFormModal } from "./PickFormModal";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getEmbeddedMatchPercent } from "@/utils/matchScore";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import type { ListItemImage, ListItemPublic } from "@/http/list-api/types";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { isOthersCategoryName } from "@/utils/listCategories";

function formatCategoryName(
  category: string,
  othersName: ListItemPublic["others_name"],
): string {
  return isOthersCategoryName(category) ? (othersName ?? category) : category;
}

interface PickCardProps {
  data: ListItemPublic;
  onRefresh?: () => void;
  readOnly?: boolean;
}

function PickCardCategoriesScroll({
  categories,
  othersName,
  textClassName,
}: {
  categories: string[];
  othersName: ListItemPublic["others_name"];
  textClassName: string;
}) {
  if (categories.length === 0) return null;

  const label = categories
    .map((category) => formatCategoryName(category, othersName))
    .join(" · ");

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      hitSlop={{ top: 12, bottom: 12 }}
      style={{ width: "100%" }}
    >
      <Text className={textClassName}>{label}</Text>
    </ScrollView>
  );
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
  onOpenDetail: () => void;
}

function PickCardBody({
  data,
  thumbnails,
  locationLabel,
  padForMatchOverlay = false,
  onOpenDetail,
}: PickCardBodyProps) {
  const primaryImage = thumbnails[0];
  const heroImageUrl = primaryImage
    ? (resolveImageUrl(primaryImage.url) ?? primaryImage.url)
    : null;

  const showTitleInBody = !heroImageUrl && Boolean(data.business_name);
  const showCategoriesInBody = !heroImageUrl && data.categories.length > 0;

  const bodyPaddingClass =
    !heroImageUrl && padForMatchOverlay ? "p-3 pt-10 gap-1" : "p-3 gap-1";

  return (
    <View className="w-full">
      {heroImageUrl ? (
        <CardHero
          imageUrl={heroImageUrl}
          title={data.business_name ?? ""}
          onPress={onOpenDetail}
          subtitleNode={
            data.categories.length > 0 ? (
              <PickCardCategoriesScroll
                categories={data.categories}
                othersName={data.others_name}
                textClassName="text-sm text-white"
              />
            ) : undefined
          }
          aspectClassName="aspect-[16/12] rounded-t-2xl"
          titleSize="text-2xl"
          subtitleSize="text-sm"
        />
      ) : null}

      <View className={bodyPaddingClass}>
        {showTitleInBody ? (
          <Pressable onPress={onOpenDetail} className="cursor-pointer">
            <View className="flex-row items-center gap-1.5">
              <Text
                className="text-sm font-geist-medium text-ink dark:text-gray-100 flex-1"
                numberOfLines={1}
              >
                {data.business_name}
              </Text>
              {data.is_verified && <BadgeCheck size={14} color="#FF6B1A" />}
            </View>
          </Pressable>
        ) : null}

        {showCategoriesInBody ? (
          <PickCardCategoriesScroll
            categories={data.categories}
            othersName={data.others_name}
            textClassName="text-xs text-gray-400 dark:text-gray-500"
          />
        ) : null}

        <Pressable onPress={onOpenDetail} className="cursor-pointer">
          <View className="gap-1">
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

            {data.tags.length > 0 && (
              <View className="flex-row flex-wrap items-center gap-1 mt-1">
                {data.tags.map((tag) => (
                  <Badge key={tag.id} label={tag.name} variant="primary" />
                ))}
              </View>
            )}

            <PickCardOwnerRow data={data} />
          </View>
        </Pressable>
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
  // Hidden on your own picks; otherwise always shown, with a missing score as 0%.
  const showMatch = !data.is_owner;
  const personalityMatch = getEmbeddedMatchPercent(data.owner) ?? 0;

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
        <PickCardBody
          data={data}
          thumbnails={thumbnails}
          locationLabel={locationLabel}
          padForMatchOverlay={showMatch}
          onOpenDetail={() => setIsDetailOpen(true)}
        />

        {showMatch ? (
          <View className="absolute left-2 top-2 z-10" pointerEvents="none">
            <PersonalityMatchPill
              variant="overlayCompact"
              percent={personalityMatch}
            />
          </View>
        ) : null}

        <View className="absolute right-2 top-2 flex-row items-center gap-1">
          {!data.is_owner && data.owner ? (
            <ReportFlagButton
              userId={data.owner.id}
              displayName={data.owner.name}
              contentType="pick"
              contentId={data.id}
              size={14}
              className="rounded-full p-1.5 cursor-pointer"
              style={actionIconBackingStyle}
            />
          ) : null}
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
