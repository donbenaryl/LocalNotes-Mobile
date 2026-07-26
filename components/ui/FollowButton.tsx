import { ActivityIndicator, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { useUserFollow } from "@/hooks/useUserFollow";

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
  const isControlled = controlledIsFollowed !== undefined;
  const {
    isFollowed: internalIsFollowed,
    isLoading: internalLoading,
    toggle,
  } = useUserFollow(userId, initialIsFollowed);

  const isFollowed = isControlled ? controlledIsFollowed : internalIsFollowed;
  const loading = controlledLoading ?? internalLoading;

  const handlePress = async () => {
    if (loading) return;

    if (onToggle) {
      await onToggle();
      return;
    }

    await toggle();
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
