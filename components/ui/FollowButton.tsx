import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import accountService from "@/http/account-api/account.services";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";

interface FollowButtonProps {
  userId: string;
  initialIsFollowed: boolean;
  useButton?: boolean;
}

export function FollowButton({
  userId,
  initialIsFollowed,
  useButton = false,
}: FollowButtonProps) {
  const { t } = useTranslation();
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFollowed(initialIsFollowed);
  }, [initialIsFollowed]);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isFollowed) {
        await accountService.unfollowUser(userId);
        setIsFollowed(false);
      } else {
        await accountService.followUser(userId);
        setIsFollowed(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setLoading(false);
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
