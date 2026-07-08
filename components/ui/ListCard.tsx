import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { toast } from "@/components/ui/Toast";
import listService from "@/http/list-api/list.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { useListFormStore } from "@/stores/useListFormStore";
import { useSimilarScores } from "@/hooks/useSimilarScores";
import { formatListLocation } from "@/utils/listUi";
import type { ListItemDAO } from "@/http/list-api/types";
import type { similarUserScore } from "@/http/recommendations-api/types";
import { ListCardHeading } from "./list-card/ListCardHeading";
import { ListCardBody } from "./list-card/ListCardBody";
import { ListCardFooter } from "./list-card/ListCardFooter";

interface ListCardProps {
  data: ListItemDAO;
  onPinChange?: (id: string, newPinnedState: boolean) => void;
  onDeleted?: (id: string) => void;
  isLoading?: boolean;
  disableActions?: boolean;
  forceShowFollowButton?: boolean;
  forceShowPinIcon?: boolean;
  similarScoresDummy?: similarUserScore;
}

export function ListCard({
  data,
  onPinChange,
  onDeleted,
  disableActions = false,
  forceShowFollowButton = false,
  forceShowPinIcon = false,
  similarScoresDummy,
}: ListCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();

  const id = data.id;
  const isDraft = data.status?.toLowerCase() === "draft";
  const isOwnList = user?.id === data.account.id;
  const isUser = isOwnList;

  const [pinnedLoading, setPinnedLoading] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const [localPinnedState, setLocalPinnedState] = useState(data.is_pinned);
  const [localLikedState, setLocalLikedState] = useState(data.is_liked);
  const [localSavedState, setLocalSavedState] = useState(data.is_saved);
  const [localReactions, setLocalReactions] = useState(data.likes || 0);
  const [localSaves, setLocalSaves] = useState(data.saves || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { similarScores } = useSimilarScores(data.account.id, !disableActions && !isUser);

  useEffect(() => {
    setLocalPinnedState(data.is_pinned);
    setLocalLikedState(data.is_liked);
    setLocalSavedState(data.is_saved);
    setLocalReactions(data.likes || 0);
    setLocalSaves(data.saves || 0);
  }, [data.is_pinned, data.is_liked, data.is_saved, data.likes, data.saves]);

  const handleDelete = () => {
    if (isDeleting || disableActions) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await listService.deleteList(id);
      setIsDeleteModalOpen(false);
      onDeleted?.(id);
    } catch (error) {
      console.error("Failed to delete the list:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (disableActions) return;
    useListFormStore.getState().clearEditHydration();
    router.push(`/(app)/(stack)/lists/${id}/edit` as never);
  };

  const toggleFavorite = async () => {
    if (pinnedLoading || disableActions) return;
    setPinnedLoading(id);
    try {
      if (localPinnedState) {
        await listService.unpinLists(id);
      } else {
        await listService.pinLists(id);
      }
      const newPinnedState = !localPinnedState;
      setLocalPinnedState(newPinnedState);
      onPinChange?.(id, newPinnedState);
    } catch (err) {
      console.error(`Failed to toggle pin for list ${id}:`, err);
    } finally {
      setPinnedLoading(null);
    }
  };

  const handleLike = async () => {
    if (likeLoading || disableActions) return;
    setLikeLoading(id);
    try {
      await listService.likeUnlikeList(id);
      const newLikedState = !localLikedState;
      setLocalLikedState(newLikedState);
      setLocalReactions((prev) => (newLikedState ? prev + 1 : prev - 1));
    } catch (err) {
      console.error(`Failed to toggle like for list ${id}:`, err);
    } finally {
      setLikeLoading(null);
    }
  };

  const handleSave = async () => {
    if (saveLoading || disableActions || isOwnList) return;
    setSaveLoading(id);
    try {
      await listService.saveUnsaveList(id);
      const newSavedState = !localSavedState;
      setLocalSavedState(newSavedState);
      setLocalSaves((prev) => (newSavedState ? prev + 1 : prev - 1));
    } catch (err) {
      console.error(`Failed to toggle save for list ${id}:`, err);
    } finally {
      setSaveLoading(null);
    }
  };

  const handleSeeMore = () => {
    if (disableActions) return;
    router.push(`/lists/${id}` as never);
  };

  const handleProfileClick = () => {
    if (disableActions) return;
    toast.info(t("alerts.comingSoonMessage"), { title: t("alerts.comingSoon") });
  };

  return (
    <>
      <ConfirmDeleteModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      <Pressable
        onPress={handleSeeMore}
        disabled={disableActions}
        accessibilityRole="button"
        className="cursor-pointer"
      >
        <WhiteBox className="flex flex-col">
          <ListCardHeading
            account={data.account}
            isDraft={isDraft}
            onProfileClick={handleProfileClick}
            personalityName={data.personality_name}
            isUser={isUser}
            similarScores={similarScores || similarScoresDummy}
            disableActions={disableActions}
            isDeleting={isDeleting}
            currentUserId={user?.id}
            isFollowed={data.account_is_followed}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPin={toggleFavorite}
            forceShowFollowButton={forceShowFollowButton}
          />

          <ListCardBody
            title={data.name}
            description={data.notes}
            items={data.items}
            personalityColor={data.personality_color}
          />

          <ListCardFooter
            id={id}
            isDraft={isDraft}
            disableActions={disableActions}
            likeLoading={likeLoading}
            saveLoading={saveLoading}
            pinnedLoading={pinnedLoading}
            localLikedState={localLikedState}
            localSavedState={localSavedState}
            localPinnedState={localPinnedState}
            localReactions={localReactions}
            localSaves={localSaves}
            comments={data.comments || 0}
            tagsLength={data.items?.length ?? 0}
            shares={data.shares}
            isOwnList={isOwnList}
            location={formatListLocation(data.location)}
            categories={data.categories}
            others_name={data.others_name}
            forceShowPinIcon={forceShowPinIcon}
            onLike={handleLike}
            onSave={handleSave}
            onPin={toggleFavorite}
          />
        </WhiteBox>
      </Pressable>
    </>
  );
}
