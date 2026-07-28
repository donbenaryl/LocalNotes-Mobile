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
  /** Visual style. `"outline"` is the pill border look (light/dark aware). */
  variant?: "default" | "outline";
  /** @deprecated Prefer `variant`. Kept for existing call sites. */
  buttonVariant?: "default" | "outline";
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
  variant,
  buttonVariant,
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
  const resolvedVariant = variant ?? buttonVariant ?? "default";
  const label = isFollowed
    ? t("profile.lists.following")
    : t("profile.lists.follow");

  const handlePress = async () => {
    if (loading) return;

    if (onToggle) {
      await onToggle();
      return;
    }

    await toggle();
  };

  if (resolvedVariant === "outline") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ selected: isFollowed, busy: loading }}
        className={`min-h-10 cursor-pointer items-center justify-center rounded-full px-4 ${
          isFollowed
            ? "border border-gray-200 bg-white dark:border-gray-700 dark:bg-ink"
            : "border-[1.5px] border-ink bg-white dark:border-gray-100 dark:bg-ink"
        }`}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isFollowed ? "#6B7280" : "#141413"}
          />
        ) : (
          <Text
            className={`font-geist-bold text-[13px] ${
              isFollowed
                ? "text-gray-500 dark:text-gray-400"
                : "text-ink dark:text-gray-100"
            }`}
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  if (useButton) {
    return (
      <LocalNotesButton
        label={label}
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
      className="cursor-pointer rounded-full bg-brand-tint px-2.5 py-1 dark:bg-brand/20"
    >
      <Text className="font-geist-semibold text-brand">{label}</Text>
    </Pressable>
  );
}
