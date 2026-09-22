import { Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedReaction,
  runOnJS,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { useProfileChrome } from "./ProfileChromeProvider";
import { useBusinessFollow } from "@/hooks/useBusinessFollow";
import { useSimilarScores } from "@/hooks/useSimilarScores";
import {
  getDominantPersonalityColor,
  getPersonalityGradientColors,
} from "@/utils/personalityRing";
import { clampPercent, getMatchPercentColor } from "@/utils/matchScore";
import type { profileItemDAO } from "@/http/account-api/types";
import type { BusinessItemDAO } from "@/http/business-api/types";

interface ProfileVitalBarProps {
  profile?: profileItemDAO | null;
  business?: BusinessItemDAO | null;
  isOwnProfile?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return `rgba(15, 139, 126, ${alpha})`;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ProfileVitalBar({
  profile,
  business,
  isOwnProfile = true,
}: ProfileVitalBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { hideProgress } = useProfileChrome();
  const [interactive, setInteractive] = useState(false);

  const isBusinessMode = Boolean(business);
  const displayName = business?.name ?? profile?.name ?? "";
  const displayImage = business?.logo ?? profile?.profile_image_url;
  const subtitle = isBusinessMode
    ? business?.business_type
    : profile?.personality_name;

  const gradientColors = isBusinessMode
    ? undefined
    : getPersonalityGradientColors(profile?.personality_color);
  const accentColor = isBusinessMode
    ? "#FF6B1A"
    : getDominantPersonalityColor(profile?.personality_color);
  const accentSoftBorder = hexToRgba(accentColor, isDark ? 0.35 : 0.22);

  const { matchPercent, isLoading: isMatchLoading } = useSimilarScores(
    profile?.id ?? "",
    !isOwnProfile && !isBusinessMode && Boolean(profile?.id),
  );
  const showMatch = !isOwnProfile && !isBusinessMode && !isMatchLoading;
  const matchColor = getMatchPercentColor(matchPercent ?? 0);
  const clampedMatch = clampPercent(matchPercent ?? 0);

  const { isFollowed, isToggling, toggle } = useBusinessFollow(
    business?.id,
    business?.is_followed ?? false,
  );

  useAnimatedReaction(
    () => hideProgress.value > 0.01,
    (visible, prev) => {
      if (visible === prev) return;
      runOnJS(setInteractive)(visible);
    },
    [hideProgress],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: hideProgress.value,
    transform: [
      { translateY: interpolate(hideProgress.value, [0, 1], [-8, 0]) },
    ],
  }));

  if (!business && !profile) return null;

  return (
    <View
      className="absolute inset-0"
      pointerEvents={interactive ? "auto" : "none"}
      accessibilityElementsHidden={!interactive}
      importantForAccessibility={interactive ? "yes" : "no-hide-descendants"}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            flex: 1,
            paddingTop: insets.top,
            justifyContent: "flex-end",
            backgroundColor: isDark
              ? "rgba(17, 24, 39, 0.92)"
              : "rgba(247, 245, 239, 0.82)",
          },
        ]}
      >
        <View className="flex-row items-center gap-2.5 border-b border-black/10 px-3.5 py-[7px] dark:border-white/10">
          <Avatar
            name={displayName}
            src={displayImage}
            size="sm"
            gradientColors={gradientColors}
          />

          <View className="min-w-0 flex-1 leading-[1.15]">
            <Text
              className="font-geist-bold text-[13.5px] text-ink dark:text-gray-100"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {subtitle ? (
              <Text
                className={
                  isBusinessMode
                    ? "font-geist text-[11.5px] text-gray-500 dark:text-gray-400"
                    : "font-fraunces text-[11.5px] italic"
                }
                style={isBusinessMode ? undefined : { color: accentColor }}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {!isOwnProfile ? (
            <View className="shrink-0 flex-row items-center gap-2">
              {showMatch ? (
                <View
                  className="shrink-0 flex-row items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 dark:bg-gray-800"
                  style={{ borderColor: accentSoftBorder }}
                >
                  <View
                    className="h-[7px] w-[7px] rounded-full"
                    style={{
                      backgroundColor: matchColor,
                      shadowColor: matchColor,
                      shadowOpacity: 0.16,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  />
                  <Text
                    className="font-geist-extrabold text-[11.5px]"
                    style={{ color: matchColor }}
                    numberOfLines={1}
                  >
                    {t("profile.vitalBar.match", { percent: clampedMatch })}
                  </Text>
                </View>
              ) : null}

              {isBusinessMode && business ? (
                <FollowButton
                  userId={business.id}
                  initialIsFollowed={Boolean(business.is_followed)}
                  isFollowed={isFollowed}
                  onToggle={toggle}
                  loading={isToggling}
                  useButton
                  isButtonFull={false}
                  buttonSize="xs"
                />
              ) : profile?.id ? (
                <FollowButton
                  userId={profile.id}
                  initialIsFollowed={Boolean(profile.is_followed)}
                  useButton
                  isButtonFull={false}
                  buttonSize="xs"
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
