import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import accountService from "@/http/account-api/account.services";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";

interface FollowButtonProps {
  userId: string;
  initialIsFollowed: boolean;
  useButton?: boolean;
  isFollowed?: boolean;
  onToggle?: () => void | Promise<void>;
  loading?: boolean;
  buttonSize?: "xs" | "sm" | "md" | "lg";
  isButtonFull?: boolean;
}

export function FollowButton({
  userId,
  initialIsFollowed,
  useButton = false,
  isFollowed: controlledIsFollowed,
  onToggle,
  loading: controlledLoading,
  buttonSize = "md",
  isButtonFull = true,
}: FollowButtonProps) {
  const { t } = useTranslation();
  const [internalIsFollowed, setInternalIsFollowed] = useState(initialIsFollowed);
  const [internalLoading, setInternalLoading] = useState(false);

  const isControlled = controlledIsFollowed !== undefined;
  const isFollowed = isControlled ? controlledIsFollowed : internalIsFollowed;
  const loading = controlledLoading ?? internalLoading;

  useEffect(() => {
    if (!isControlled) {
      setInternalIsFollowed(initialIsFollowed);
    }
  }, [initialIsFollowed, isControlled]);

  const handlePress = async () => {
    if (loading) return;

    if (onToggle) {
      await onToggle();
      return;
    }

    setInternalLoading(true);
    try {
      if (isFollowed) {
        await accountService.unfollowUser(userId);
        setInternalIsFollowed(false);
      } else {
        await accountService.followUser(userId);
        setInternalIsFollowed(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  if (useButton) {
    return (
      <LocalNotesButton
        label={
          isFollowed ? t("profile.lists.following") : t("profile.lists.follow")
        }
        onPress={handlePress}
        variant={isFollowed ? "light" : "dark"}
        loading={loading}
        isRounded
        size={buttonSize}
        isWidthFull={isButtonFull}
      />
    );
  }

  if (loading) {
    return <ActivityIndicator size="small" color="#FF6B1A" />;
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      className="cursor-pointer rounded-full px-2.5 py-1 bg-brand-tint dark:bg-brand/20"
    >
      <Text className="font-geist-semibold text-brand">
        {isFollowed ? t("profile.lists.following") : t("profile.lists.follow")}
      </Text>
    </Pressable>
  );
}
