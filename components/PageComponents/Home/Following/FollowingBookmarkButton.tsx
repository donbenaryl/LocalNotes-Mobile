import { Pressable } from "react-native";
import { Bookmark } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { brandColor } from "@/constants/colors";

interface FollowingBookmarkButtonProps {
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function FollowingBookmarkButton({
  active,
  disabled = false,
  onPress,
  accessibilityLabel,
}: FollowingBookmarkButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const idleColor = isDark ? "#D1D5DB" : "#4B5563";
  const activeColor = brandColor(isDark);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active, busy: disabled }}
      className="h-8 w-8 cursor-pointer items-center justify-center"
    >
      <Bookmark
        size={18}
        color={active ? activeColor : idleColor}
        fill={active ? activeColor : "transparent"}
      />
    </Pressable>
  );
}
