import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Heart } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { MentionedText } from "@/components/ui/MentionedText";
import { MentionTextInput } from "@/components/ui/MentionTextInput";
import { PageLoader } from "@/components/ui/PageLoader";
import listService from "@/http/list-api/list.service";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { formatRelativeTime } from "@/utils/time";
import type { Comment, ListItemDAO } from "@/http/list-api/types";
import type { MentionSearchResultItem } from "@/http/account-api/types";

interface ListDetailsCommentsProps {
  list: ListItemDAO;
}

export function ListDetailsComments({ list }: ListDetailsCommentsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [pickedMentions, setPickedMentions] = useState<
    MentionSearchResultItem[]
  >([]);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    () => new Set(),
  );
  const [repliesByParent, setRepliesByParent] = useState<
    Record<string, Comment[]>
  >({});
  const [likedComments, setLikedComments] = useState<Set<string>>(
    () => new Set(),
  );
  const [commentLoading, setCommentLoading] = useState<string | null>(null);

  const { data: comments = [], isPending } = useQuery({
    queryKey: ["list-comments", list.id],
    queryFn: async () => {
      const response = await listService.fetchListComments(list.id);
      return response.data?.data ?? [];
    },
  });

  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parent),
    [comments],
  );

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      const trimmedContent = commentText.trim();
      const mentionIds = pickedMentions
        .filter((user) => trimmedContent.includes(`@${user.name}`))
        .map((user) => user.id);
      const response = await listService.createListComment(
        list.id,
        { content: trimmedContent, mentioned_account_ids: mentionIds },
        replyTo?.id,
      );
      return response.data?.data ?? null;
    },
    onSuccess: (newComment) => {
      setCommentText("");
      setPickedMentions([]);
      setReplyTo(null);

      if (newComment?.parent) {
        const parentId = newComment.parent;
        setRepliesByParent((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] ?? []), newComment],
        }));
        setExpandedReplies((prev) => new Set(prev).add(parentId));
      }

      void queryClient.invalidateQueries({
        queryKey: ["list-comments", list.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["list-detail", list.id],
      });
    },
  });

  const loadReplies = async (parentId: string) => {
    const response = await listService.fetchListComments(list.id, {
      parent_comment: parentId,
    });
    const replies = response.data?.data ?? [];
    setRepliesByParent((prev) => ({ ...prev, [parentId]: replies }));
  };

  const toggleReplies = async (commentId: string) => {
    const next = new Set(expandedReplies);
    if (next.has(commentId)) {
      next.delete(commentId);
    } else {
      next.add(commentId);
      if (!repliesByParent[commentId]) {
        await loadReplies(commentId);
      }
    }
    setExpandedReplies(next);
  };

  const handleSubmit = () => {
    if (!commentText.trim() || createCommentMutation.isPending) return;
    createCommentMutation.mutate();
  };

  const updateCommentLikesCount = (commentId: string, delta: number) => {
    queryClient.setQueryData<Comment[]>(
      ["list-comments", list.id],
      (prev) =>
        prev?.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes_count: comment.likes_count + delta }
            : comment,
        ) ?? [],
    );

    setRepliesByParent((prev) => {
      const next = { ...prev };
      for (const parentId of Object.keys(next)) {
        next[parentId] = next[parentId].map((reply) =>
          reply.id === commentId
            ? { ...reply, likes_count: reply.likes_count + delta }
            : reply,
        );
      }
      return next;
    });
  };

  const handleLikeComment = async (commentId: string) => {
    if (commentLoading) return;
    setCommentLoading(commentId);
    try {
      await listService.likeUnlikeComment(commentId);
      const isLiked = likedComments.has(commentId);
      setLikedComments((prev) => {
        const next = new Set(prev);
        if (isLiked) {
          next.delete(commentId);
        } else {
          next.add(commentId);
        }
        return next;
      });
      updateCommentLikesCount(commentId, isLiked ? -1 : 1);
    } catch (error) {
      console.error(`Failed to toggle like for comment ${commentId}:`, error);
    } finally {
      setCommentLoading(null);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const gradientColors = getPersonalityGradientColors(
      comment.account.personality_color,
    );
    const replies = repliesByParent[comment.id] ?? [];
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <View key={comment.id} className={isReply ? "ml-10" : ""}>
        <View className="mb-3.5 flex-row gap-2.5">
          <Avatar
            name={comment.account.name}
            src={resolveImageUrl(comment.account.profile_image) ?? undefined}
            userId={comment.account.id}
            size="xs"
            gradientColors={gradientColors}
          />
          <View className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800">
            <View className="flex-row flex-wrap items-center gap-1.5">
              <Text className="font-geist-bold text-[12.5px] text-ink dark:text-gray-100">
                {comment.account.name}
              </Text>
              <Text className="font-geist text-[11px] text-gray-400">
                {formatRelativeTime(comment.created_at)}
              </Text>
            </View>
            <MentionedText
              content={comment.content}
              mentionedAccounts={comment.mentioned_accounts}
              className="mt-1 font-geist text-[13px] leading-5 text-gray-800 dark:text-gray-200"
            />
            <View className="mt-2 flex-row flex-wrap items-center gap-3">
              {!isReply && list.others_can_comment ? (
                <Pressable
                  onPress={() => setReplyTo(comment)}
                  className="cursor-pointer"
                >
                  <Text className="font-geist-medium text-xs text-gray-500 dark:text-gray-400">
                    {t("listDetail.reply")}
                  </Text>
                </Pressable>
              ) : null}
              {!isReply && comment.replies_count > 0 ? (
                <Pressable
                  onPress={() => void toggleReplies(comment.id)}
                  className="cursor-pointer"
                >
                  <Text className="font-geist-semibold text-xs text-brand">
                    {isExpanded
                      ? t("listDetail.hideReplies")
                      : t("listDetail.viewReplies", {
                          count: comment.replies_count,
                        })}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => void handleLikeComment(comment.id)}
                disabled={commentLoading === comment.id}
                accessibilityRole="button"
                className="cursor-pointer flex-row items-center gap-1"
              >
                {commentLoading === comment.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Heart
                    size={14}
                    color={
                      likedComments.has(comment.id) || comment.likes_count > 0
                        ? "#EF4444"
                        : "#9CA3AF"
                    }
                    fill={
                      likedComments.has(comment.id) || comment.likes_count > 0
                        ? "#EF4444"
                        : "transparent"
                    }
                  />
                )}
                <Text
                  className={`font-geist text-xs ${
                    likedComments.has(comment.id)
                      ? "text-red-500"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {comment.likes_count}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {isExpanded
          ? replies.map((reply) => renderComment(reply, true))
          : null}
      </View>
    );
  };

  return (
    <View className="px-[18px] py-[18px]">
      <Text className="mb-3 font-geist-bold text-[13px] text-ink dark:text-gray-100">
        {t("listDetail.comments", { count: list.comments ?? rootComments.length })}
      </Text>

      {isPending ? (
        <View className="py-6">
          <PageLoader fullPage={false} size="small" />
        </View>
      ) : rootComments.length === 0 ? (
        <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
          {t("listDetail.noComments")}
        </Text>
      ) : (
        rootComments.map((comment) => renderComment(comment))
      )}

      {list.others_can_comment ? (
        <View className="mt-4 gap-2">
          {replyTo ? (
            <View className="flex-row items-center justify-between">
              <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                {t("listDetail.replyTo", { name: replyTo.account.name })}
              </Text>
              <Pressable
                onPress={() => setReplyTo(null)}
                className="cursor-pointer"
              >
                <Text className="font-geist-semibold text-xs text-brand">
                  {t("listDetail.cancelReply")}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <MentionTextInput
            value={commentText}
            onChangeText={setCommentText}
            onMentionSelect={(user) =>
              setPickedMentions((prev) => [
                ...prev.filter((u) => u.id !== user.id),
                user,
              ])
            }
            placeholder={
              replyTo
                ? t("listDetail.replyPlaceholder")
                : t("listDetail.commentPlaceholder")
            }
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-geist text-sm text-ink dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!commentText.trim() || createCommentMutation.isPending}
            className="cursor-pointer self-end rounded-full bg-brand px-4 py-2 disabled:opacity-50"
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="font-geist-semibold text-sm text-white">
                {t("listDetail.postComment")}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
