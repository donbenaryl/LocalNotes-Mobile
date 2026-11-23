import { resolveImageUrl } from "@/utils/httpHelpers";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import type { ViewOrigin } from "@/http/types";
import { resolveViewOrigin } from "@/utils/viewTracking";

type AvatarSize = "xs" | "sm" | "md" | "md2" | "lg" | "xl";

interface AvatarProps {
  name: string;
  src?: string;
  userId?: string;
  /** Background color Tailwind class used when there is no image. Defaults to `bg-brand`. */
  color?: string;
  size?: AvatarSize;
  onPress?: () => void;
  viewOrigin?: ViewOrigin;
  gradientStyle?: StyleProp<ViewStyle>;
  gradientColors?: string[];
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-5 w-5",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  md2: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-24 w-24",
};

const textSizeClasses: Record<AvatarSize, string> = {
  xs: "text-[10px]",
  sm: "text-base",
  md: "text-xl",
  md2: "text-2xl",
  lg: "text-2xl",
  xl: "text-4xl",
};

/** Matches Tailwind `h-*` / `w-*` pixel sizes used in `sizeClasses`. */
const avatarInnerSizes: Record<AvatarSize, number> = {
  xs: 20,
  sm: 30,
  md: 40,
  md2: 60,
  lg: 75,
  xl: 96,
};

const AVATAR_RING_PADDING = StyleSheet.hairlineWidth * 5;

interface AvatarContainerProps {
  children: React.ReactNode;
  gradientStyle?: StyleProp<ViewStyle>;
  gradientColors?: string[];
  size: AvatarSize;
}

function AvatarContainer({
  children,
  gradientStyle,
  gradientColors,
  size,
}: AvatarContainerProps) {
  const ringClassName = "shrink-0 rounded-full p-0.5";

  if (gradientColors && gradientColors.length > 0) {
    const colors = (
      gradientColors.length === 1
        ? [gradientColors[0], gradientColors[0]]
        : gradientColors.slice(0, 4)
    ) as [string, string, ...string[]];

    const innerSize = avatarInnerSizes[size];
    const outerSize = innerSize + AVATAR_RING_PADDING * 2;

    return (
      <View
        className="shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ width: outerSize, height: outerSize }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            width: outerSize,
            height: outerSize,
          }}
        />
        {children}
      </View>
    );
  }

  return (
    <View style={gradientStyle} className={ringClassName}>
      {children}
    </View>
  );
}

export function Avatar({
  name,
  src,
  userId,
  color = "bg-brand",
  size = "sm",
  onPress,
  viewOrigin,
  gradientStyle,
  gradientColors,
}: AvatarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const resolvedViewOrigin = resolveViewOrigin({
    explicitOrigin: viewOrigin,
    pathname,
    queryOrigin: origin,
  });
  const dimensionClass = sizeClasses[size];
  const innerSizePx = avatarInnerSizes[size];
  const hasGradientRing = Boolean(gradientColors && gradientColors.length > 0);
  const avatarShellStyle = hasGradientRing
    ? { width: innerSizePx, height: innerSizePx }
    : undefined;
  const letter = name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  const handlePress =
    onPress ??
    (userId
      ? () => router.push(`/profile/${userId}?origin=${resolvedViewOrigin}`)
      : undefined);

  const wrapPressable = (content: React.ReactNode) => {
    if (!handlePress) return content;

    return (
      <Pressable
        onPress={handlePress}
        className="cursor-pointer rounded-full"
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  };

  if (src) {
    const imageAvatar = (
      <View
        style={avatarShellStyle}
        className={`${hasGradientRing ? "" : dimensionClass} shrink-0 items-center justify-center rounded-full bg-card dark:bg-dk-card`}
      >
        <View className="h-full w-full items-center justify-center overflow-hidden rounded-full">
          <Image source={{ uri: resolveImageUrl(src) ?? undefined }} accessibilityLabel={name} className="h-[95%] w-[95%] rounded-full" />
        </View>
      </View>
    );

    return (
      <AvatarContainer gradientStyle={gradientStyle} gradientColors={gradientColors} size={size}>
        {wrapPressable(imageAvatar)}
      </AvatarContainer>
    );
  }

  const usesDefaultColor = color === "bg-brand";
  const letterAvatar = (
    <View
      style={avatarShellStyle}
      className={`${hasGradientRing ? "" : dimensionClass} shrink-0 items-center justify-center rounded-full bg-white`}
    >
      <View
        className={`h-[95%] w-[95%] items-center justify-center rounded-full ${color}${usesDefaultColor ? " dark:bg-white" : ""}`}
      >
        <Text
          className={`font-semibold text-white ${textSizeClasses[size]}${usesDefaultColor ? " dark:text-ink" : ""}`}
        >
          {letter}
        </Text>
      </View>
    </View>
  );

  return (
    <AvatarContainer gradientStyle={gradientStyle} gradientColors={gradientColors} size={size}>
      {wrapPressable(letterAvatar)}
    </AvatarContainer>
  );
}
