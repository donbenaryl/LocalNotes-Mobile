import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { similarCreatorItem } from "@/http/recommendations-api/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatCityRegion } from "@/utils/followingFeed";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { clampPercent, getMatchPercentColor } from "@/utils/matchScore";
import { getPersonalityGradientColors, getPersonalityRoleColor } from "@/utils/personalityRing";
import { cn } from "@/utils/cn";
import { withViewOrigin } from "@/utils/viewTracking";

const CARD_WIDTH_RATIO = 0.6;
const CARD_GAP = 12;

interface FollowingFreshPerspectivesProps {
  users: similarCreatorItem[];
  isLoading: boolean;
  isError: boolean;
}

function FreshPerspectiveCard({ user, width }: { user: similarCreatorItem; width: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const personalityName = user.personality_name?.trim() ?? "";
  const locationLabel = formatCityRegion(
    user.location
      ? {
          city: user.location.city ?? "",
          region: user.location.region ?? "",
        }
      : null,
  );
  const matchValue = clampPercent(user.match ?? 0);
  const matchColor = getMatchPercentColor(matchValue);
  const isDark = colorScheme === "dark";
  const badgeTextColor = isDark
    ? matchValue <= 40
      ? "#FCA5A5"
      : matchValue <= 69
        ? "#F3D19C"
        : "#B7E4C7"
    : matchColor;
  const badgeBackground = isDark
    ? matchValue > 69
      ? "#1B4332"
      : `${matchColor}55`
    : `${matchColor}26`;
  const roleColor = personalityName
    ? getPersonalityRoleColor(personalityName)
    : undefined;

  const openProfile = () => {
    router.push(withViewOrigin(`/profile/${user.id}`, "recommendation") as never);
  };

  return (
    <Pressable
      onPress={openProfile}
      accessibilityRole="button"
      accessibilityLabel={user.name}
      style={{ width }}
      className="cursor-pointer p-3.5 border border-gray-200 bg-soft dark:border-gray-700 dark:bg-gray-800/60 rounded-2xl"
    >
      <View className="flex-row items-start gap-2">
        <View className="min-w-0 flex-1 gap-2.5">
          <View className="flex-row items-center gap-2">
            <Avatar
              name={user.name}
              src={resolveImageUrl(user.profile_image) ?? undefined}
              size="sm"
              gradientColors={getPersonalityGradientColors(user.personality_color)}
            />
            <Text
              className="min-w-0 flex-1 font-geist-bold text-sm text-ink dark:text-gray-100"
              numberOfLines={1}
            >
              {user.name}
            </Text>
          </View>

          {personalityName ? (
            <Text
              className="font-geist-medium text-[13px]"
              style={{ color: roleColor }}
              numberOfLines={1}
            >
              {personalityName}
            </Text>
          ) : null}

          {locationLabel ? (
            <Text
              className="font-geist text-sm text-gray-500 dark:text-gray-300"
              numberOfLines={1}
            >
              {locationLabel}
            </Text>
          ) : null}
        </View>
        <FollowButton userId={user.id} initialIsFollowed={user.is_followed} variant="outline" />
      </View>
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <Text
          className="min-w-0 flex-1 font-geist text-xs text-gray-500 dark:text-gray-400"
          numberOfLines={1}
        >
          {t("home.following.freshPerspectives.postsThisMonth", {
            count: user.posts_this_month ?? 0,
          })}
        </Text>
        <View className="rounded-lg px-2.5 py-1" style={{ backgroundColor: badgeBackground }}>
          <Text className="font-geist-bold text-xs" style={{ color: badgeTextColor }}>
            {matchValue}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function FollowingFreshPerspectives({
  users,
  isLoading,
  isError,
}: FollowingFreshPerspectivesProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const visibleUsers = useMemo(
    () => (currentUserId ? users.filter((user) => user.id !== currentUserId) : users),
    [users, currentUserId],
  );
  const cardWidth = Math.round(screenWidth * CARD_WIDTH_RATIO);
  const scrollRef = useRef<ScrollView>(null);
  const [offset, setOffset] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const iconColor = colorScheme === "dark" ? "#F3F4F6" : "#141413";
  const maxOffset = Math.max(0, contentWidth - viewportWidth);
  const canScrollBack = offset > 4;
  const canScrollForward = offset < maxOffset - 4;

  const scrollBy = useCallback(
    (direction: 1 | -1) => {
      const step = cardWidth + CARD_GAP;
      const target = Math.min(maxOffset, Math.max(0, offset + direction * step));
      scrollRef.current?.scrollTo({ x: target, animated: true });
    },
    [cardWidth, maxOffset, offset],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setOffset(event.nativeEvent.contentOffset.x);
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  }, []);

  if (isError || (!isLoading && visibleUsers.length === 0)) return null;

  return (
    <View className="mt-8 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-geist-semibold text-lg text-ink dark:text-gray-100">
          {t("home.following.freshPerspectives.title")}
        </Text>
        {!isLoading ? (
          <View className="flex-row gap-2">
            {(
              [
                { dir: -1, Icon: ChevronLeft, enabled: canScrollBack, label: "previous" },
                { dir: 1, Icon: ChevronRight, enabled: canScrollForward, label: "next" },
              ] as const
            ).map(({ dir, Icon, enabled, label }) => (
              <Pressable
                key={label}
                onPress={() => scrollBy(dir)}
                disabled={!enabled}
                accessibilityRole="button"
                accessibilityLabel={t(`home.following.freshPerspectives.${label}`)}
                className={cn(
                  "h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-300 dark:border-gray-700",
                  !enabled && "opacity-40",
                )}
              >
                <Icon size={18} color={iconColor} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-row gap-3">
          {[0, 1].map((key) => (
            <View key={key} style={{ width: cardWidth }}>
              <Skeleton className="h-[156px] w-full rounded-2xl" />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          onLayout={handleLayout}
          onContentSizeChange={(width) => setContentWidth(width)}
          contentContainerStyle={{ gap: CARD_GAP }}
        >
          {visibleUsers.map((user) => (
            <FreshPerspectiveCard key={user.id} user={user} width={cardWidth} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
