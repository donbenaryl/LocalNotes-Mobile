import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Edit, Flag, MapPin, Trash2, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import type { CardOptionsMenuItem } from "@/components/ui/CardOptionsMenu";
import { ListAuthorRow } from "@/components/ui/ListAuthorRow";
import { ListEngagementRow } from "@/components/ui/ListEngagementRow";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { ReportUserSheet } from "@/components/PageComponents/Safety/ReportUserSheet";
import accountService from "@/http/account-api/account.services";
import listService from "@/http/list-api/list.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { useListFormStore } from "@/stores/useListFormStore";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { isOthersCategoryName } from "@/utils/listCategories";
import { formatListLocation } from "@/utils/listUi";
import { getListMatchPercent } from "@/utils/matchScore";
import { getDominantPersonalityColor } from "@/utils/personalityRing";
import type { ListItemDAO } from "@/http/list-api/types";

interface ListDetailsHeaderProps {
  list: ListItemDAO;
  /** When set (modal context), closes the modal. */
  onClose?: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function getListCoverImageUrl(list: ListItemDAO): string | null {
  const cover = resolveImageUrl(list.image_url);
  if (cover) return cover;

  for (const item of list.items ?? []) {
    const itemImage =
      resolveImageUrl(item.images?.[0]?.url) ??
      resolveImageUrl(item.business?.logo);
    if (itemImage) return itemImage;
  }

  return null;
}

function formatListCategoriesSubtitle(
  categories: string[],
  othersName?: string | null,
): string | undefined {
  if (categories.length === 0) return undefined;
  return categories
    .map((category) =>
      isOthersCategoryName(category) ? (othersName ?? category) : category,
    )
    .join(" · ");
}

export function ListDetailsHeader({
  list,
  onClose,
}: ListDetailsHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnList = currentUserId === list.account.id;
  const coverImageUrl = getListCoverImageUrl(list);
  const locationLabel = formatListLocation(list.location);
  const categoryLabel = formatListCategoriesSubtitle(
    list.categories,
    list.others_name,
  );
  const accentColor = getDominantPersonalityColor(
    list.account.personality_color,
  );
  const personalityMatch = getListMatchPercent(list) ?? 0;
  const notesText = list.notes ? stripHtml(list.notes).trim() : "";

  const [isFollowed, setIsFollowed] = useState(list.account_is_followed);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setIsFollowed(list.account_is_followed);
  }, [list.id, list.account_is_followed]);

  const patchListDetailCache = useCallback(
    (patch: Partial<ListItemDAO>) => {
      queryClient.setQueryData<ListItemDAO | null>(
        ["list-detail", list.id],
        (prev) => (prev ? { ...prev, ...patch } : prev),
      );
    },
    [list.id, queryClient],
  );

  const handleFollowToggle = useCallback(async () => {
    if (isFollowLoading || isOwnList) return;
    setIsFollowLoading(true);
    const previousFollowed = isFollowed;
    const nextFollowed = !previousFollowed;

    setIsFollowed(nextFollowed);
    patchListDetailCache({ account_is_followed: nextFollowed });

    try {
      if (previousFollowed) {
        await accountService.unfollowUser(list.account.id);
      } else {
        await accountService.followUser(list.account.id);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      setIsFollowed(previousFollowed);
      patchListDetailCache({ account_is_followed: previousFollowed });
    } finally {
      setIsFollowLoading(false);
    }
  }, [
    isFollowLoading,
    isOwnList,
    isFollowed,
    list.account.id,
    patchListDetailCache,
  ]);

  const handleEdit = useCallback(() => {
    useListFormStore.getState().clearEditHydration();
    onClose?.();
    router.push(`/(app)/(stack)/lists/${list.id}/edit` as never);
  }, [list.id, onClose, router]);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await listService.deleteList(list.id);
      setIsDeleteModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      void queryClient.invalidateQueries({ queryKey: ["home-lists"] });
      void queryClient.invalidateQueries({ queryKey: ["list-detail", list.id] });
      onClose?.();
    } catch (error) {
      console.error("Failed to delete the list:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [list.id, onClose, queryClient]);

  const menuItems = useMemo((): CardOptionsMenuItem[] => {
    if (isOwnList) {
      return [
        {
          kind: "action",
          key: "edit",
          label: t("profile.lists.edit"),
          icon: Edit,
          onPress: handleEdit,
        },
        {
          kind: "action",
          key: "delete",
          label: t("profile.lists.delete"),
          icon: Trash2,
          variant: "destructive",
          onPress: () => setIsDeleteModalOpen(true),
        },
      ];
    }

    return [
      {
        kind: "action",
        key: "report",
        label: t("listDetail.report"),
        icon: Flag,
        variant: "destructive",
        onPress: () => setReportOpen(true),
      },
    ];
  }, [t, isOwnList, handleEdit]);

  const heroWidth = width - 28;

  return (
    <>
      {coverImageUrl ? (
        <View className="mx-3.5 mt-1">
          <View className="relative overflow-hidden rounded-[18px]">
            <View style={{ width: heroWidth, aspectRatio: 16 / 9 }}>
              <Image
                source={{ uri: coverImageUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>

            <View className="mt-3.5">
              <ListAuthorRow
                account={list.account}
                personalityName={list.personality_name}
                accentColor={accentColor}
                isOwnList={isOwnList}
                initialIsFollowed={list.account_is_followed}
                isFollowed={isFollowed}
                onFollowToggle={handleFollowToggle}
                followLoading={isFollowLoading}
                menuItems={menuItems}
                isDeleting={isDeleting}
                className="flex-row items-center gap-2.5"
              />
            </View>

            {/* {onClose ? (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("profile.picks.closeDetails")}
                className="absolute right-2.5 top-2.5 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
                hitSlop={4}
              >
                <View className="h-8 w-8 items-center justify-center rounded-full bg-white/90">
                  <X size={15} color="#57534E" strokeWidth={2.4} />
                </View>
              </Pressable>
            ) : null} */}
          </View>

          <View className="mt-3 px-1.5">
            <Text className="font-geist-extrabold text-xl leading-7 text-ink dark:text-gray-100">
              {list.name}
            </Text>
            {categoryLabel ? (
              <Text className="mt-1 font-geist-semibold text-[13px] text-gray-400">
                {categoryLabel}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="relative px-5 pt-1">
          <View className="mb-4">
            <ListAuthorRow
              account={list.account}
              personalityName={list.personality_name}
              accentColor={accentColor}
              isOwnList={isOwnList}
              initialIsFollowed={list.account_is_followed}
              isFollowed={isFollowed}
              onFollowToggle={handleFollowToggle}
              followLoading={isFollowLoading}
              menuItems={menuItems}
              isDeleting={isDeleting}
              className="flex-row items-center gap-2.5"
            />
          </View>

          {/* {onClose ? (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("profile.picks.closeDetails")}
              className="absolute right-3 top-0 z-[3] h-11 w-11 cursor-pointer items-center justify-center"
              hitSlop={4}
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-soft dark:bg-gray-800">
                <X size={15} color="#57534E" strokeWidth={2.4} />
              </View>
            </Pressable>
          ) : null} */}

          <Text className="pr-12 font-geist-extrabold text-2xl leading-7 text-ink dark:text-gray-100">
            {list.name}
          </Text>

          {categoryLabel || !isOwnList ? (
            <View className="mt-1 flex-row items-center gap-1.5">
              {categoryLabel ? (
                <Text className="shrink font-geist-semibold text-[13px] text-gray-400">
                  {categoryLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      <View className="px-2">
        {locationLabel || !isOwnList ? (
          <View className="mt-3 flex-row items-center gap-1.5 px-1.5">
            {locationLabel ? (
              <>
                <MapPin size={14} color="#57534E" />
                <Text
                  className="flex-1 font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400"
                  numberOfLines={2}
                >
                  {locationLabel}
                </Text>
              </>
            ) : (
              <View className="flex-1" />
            )}
            {!isOwnList ? (
              <PersonalityMatchPill
                percent={personalityMatch}
                personalityColor={list.account.personality_color}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Like Comment and Bookmark */}
      <ListEngagementRow list={list} className="mt-3 px-4" />

      {notesText ? (
        <View className="mx-4 mt-3.5 rounded-2xl bg-soft px-4 py-3.5 dark:bg-gray-800">
          <Text className="font-fraunces text-[15px] italic leading-6 text-ink dark:text-gray-100">
            “{notesText}”
          </Text>
        </View>
      ) : null}

      <ConfirmDeleteModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        isLoading={isDeleting}
      />

      {!isOwnList ? (
        <ReportUserSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          userId={list.account.id}
          displayName={list.account.name}
          contentType="list"
          contentId={list.id}
          onReported={() => {
            void queryClient.invalidateQueries({ queryKey: ["home"] });
            void queryClient.invalidateQueries({ queryKey: ["home-lists"] });
            void queryClient.invalidateQueries({
              queryKey: ["list-detail", list.id],
            });
          }}
        />
      ) : null}
    </>
  );
}
