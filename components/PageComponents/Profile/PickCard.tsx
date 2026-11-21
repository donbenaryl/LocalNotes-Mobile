import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  BadgeCheck,
  Bookmark,
  Edit,
  Flag,
  List,
  Share2,
  Trash2,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CardHero } from "@/components/ui/CardHero";
import {
  CardOptionsMenu,
  type CardOptionsMenuItem,
} from "@/components/ui/CardOptionsMenu";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { ShareToUsersSheet } from "@/components/ui/ShareToUsersSheet";
import { ReportUserSheet } from "@/components/PageComponents/Safety/ReportUserSheet";
import { PickDetailModal } from "./PickDetailModal";
import { PickFormModal } from "./PickFormModal";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getEmbeddedMatchPercent } from "@/utils/matchScore";
import listService from "@/http/list-api/list.service";
import { useToastStore } from "@/stores/useToastStore";
import type { ListItemImage, ListItemPublic } from "@/http/list-api/types";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { isOthersCategoryName } from "@/utils/listCategories";
import type { ViewOrigin } from "@/http/types";

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
  viewOrigin?: ViewOrigin;
}

function PickCardCategoriesScroll({
  categories,
  othersName,
  textClassName,
  scrollable = true,
}: {
  categories: string[];
  othersName: ListItemPublic["others_name"];
  textClassName: string;
  scrollable?: boolean;
}) {
  if (categories.length === 0) return null;

  const label = categories
    .map((category) => formatCategoryName(category, othersName))
    .join(" · ");

  if (!scrollable) {
    return (
      <Text className={textClassName} numberOfLines={1}>
        {label}
      </Text>
    );
  }

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

  const verifiedBadge = data.is_verified ? (
    <BadgeCheck size={14} color="#FF6B1A" />
  ) : null;

  return (
    <View className="w-full">
      {heroImageUrl ? (
        <CardHero
          imageUrl={heroImageUrl}
          title={data.business_name ?? ""}
          onPress={onOpenDetail}
          titleAccessory={verifiedBadge}
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
          <View className="flex-row items-center gap-1.5 pr-10">
            <Text
              className="text-sm font-geist-medium text-ink dark:text-gray-100 flex-1"
              numberOfLines={1}
            >
              {data.business_name}
            </Text>
            {verifiedBadge}
          </View>
        ) : null}

        {showCategoriesInBody ? (
          <PickCardCategoriesScroll
            categories={data.categories}
            othersName={data.others_name}
            textClassName="text-xs text-gray-400 dark:text-gray-500"
            scrollable={false}
          />
        ) : null}

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
      </View>
    </View>
  );
}

export function PickCard({
  data,
  onRefresh,
  readOnly = false,
  viewOrigin,
}: PickCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const showToast = useToastStore((s) => s.show);
  const canManage = !readOnly && data.is_owner;
  const thumbnails = data.images ?? [];
  const locationLabel = formatLocationLabel(data.location);
  // Hidden on your own picks; otherwise shown; a missing score renders nothing (pill returns null).
  const showMatch = !data.is_owner;
  const personalityMatch = getEmbeddedMatchPercent(data.owner);
  const shareTitle =
    data.business_name?.trim() || t("profile.picks.untitled");
  const primaryImageUrl = thumbnails[0]
    ? (resolveImageUrl(thumbnails[0].url) ?? thumbnails[0].url)
    : null;

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(data.is_favorite ?? false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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

  const handleToggleFavorite = useCallback(async () => {
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    const { error } = await listService.setListItemFavorite(data.id, nextFavorite);

    if (error) {
      setIsFavorite(!nextFavorite);
      showToast({ type: "error", message: error.message ?? t("profile.picks.favoriteError") });
    }
  }, [data.id, isFavorite, showToast, t]);

  const menuItems = useMemo((): CardOptionsMenuItem[] => {
    const favoriteItem: CardOptionsMenuItem = {
      kind: "action",
      key: "favorite",
      label: isFavorite ? t("profile.picks.saved") : t("profile.picks.save"),
      icon: Bookmark,
      variant: isFavorite ? "brand" : "default",
      onPress: () => void handleToggleFavorite(),
    };

    const shareItem: CardOptionsMenuItem = {
      kind: "action",
      key: "share",
      label: t("listDetail.share"),
      icon: Share2,
      onPress: () => setShareOpen(true),
    };

    if (canManage) {
      return [
        {
          kind: "action",
          key: "edit",
          label: t("profile.lists.edit"),
          icon: Edit,
          onPress: () => setIsEditOpen(true),
        },
        favoriteItem,
        shareItem,
        {
          kind: "action",
          key: "delete",
          label: t("profile.lists.delete"),
          icon: Trash2,
          variant: "destructive",
          onPress: () => setIsDeleteOpen(true),
        },
      ];
    }

    const items: CardOptionsMenuItem[] = [favoriteItem, shareItem];

    if (!data.is_owner && data.owner) {
      items.push({
        kind: "action",
        key: "report",
        label: t("listDetail.report"),
        icon: Flag,
        variant: "destructive",
        onPress: () => setReportOpen(true),
      });
    }

    return items;
  }, [canManage, data.is_owner, data.owner, handleToggleFavorite, isFavorite, t]);

  const actionIconBackingStyle = {
    backgroundColor: colorScheme === "dark" ? "rgba(17,24,39,0.8)" : "rgba(255,255,255,0.9)",
  };

  return (
    <>
      <Pressable
        onPress={() => setIsDetailOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={data.business_name ?? data.description ?? undefined}
        className="w-full cursor-pointer"
      >
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

          <View
            className="absolute right-2 top-2 z-10 rounded-full"
            style={actionIconBackingStyle}
          >
            <CardOptionsMenu items={menuItems} isDeleting={isDeleting} />
          </View>
        </WhiteBox>
      </Pressable>

      <PickDetailModal
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={data}
        viewOrigin={viewOrigin}
      />

      {canManage ? (
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
      ) : null}

      {!data.is_owner && data.owner ? (
        <ReportUserSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          userId={data.owner.id}
          displayName={data.owner.name}
          contentType="pick"
          contentId={data.id}
        />
      ) : null}

      <ShareToUsersSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        target={data.id ? { kind: "pick", itemId: data.id } : null}
        shareInfo={{
          title: shareTitle,
          subtitle: data.description ?? undefined,
          imageUrl: primaryImageUrl,
        }}
      />
    </>
  );
}
