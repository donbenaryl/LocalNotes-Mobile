import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { ImageFullScreen } from '@/components/ui/ImageFullScreen';
import { BusinessHomeRow } from '@/components/PageComponents/Profile/BusinessHomeRow';
import { FeaturedInCard } from '@/components/PageComponents/Profile/FeaturedInCard';
import { FollowersFollowingModal } from '@/components/PageComponents/Profile/FollowersFollowingModal';
import { useBusinessOwnerProfileInsights } from '@/hooks/useBusinessOwnerProfileInsights';
import type { FollowListTab } from '@/hooks/useFollowList';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSimilarScores } from '@/hooks/useSimilarScores';
import { brandColor } from '@/constants/colors';
import {
  getDominantPersonalityColor,
  getPersonalityGradientColors,
} from '@/utils/personalityRing';
import { getMatchPercentColor } from '@/utils/matchScore';
import { isInferredPersonality } from '@/utils/personality';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { resolveUserLabels } from '@/utils/userDisplayName';
import { cn } from '@/utils/cn';
import businessService from '@/http/business-api/business.service';
import type { AccountLocationDTO, profileItemDAO } from '@/http/account-api/types';
import type { BusinessItemDAO, BusinessLocation } from '@/http/business-api/types';

interface ProfileInfoProps {
  profile?: profileItemDAO | null;
  business?: BusinessItemDAO | null;
  isOwnProfile?: boolean;
}

interface CompactStatItem {
  value: string;
  label: string;
  onPress?: () => void;
}

const BIO_COLLAPSE_LINES = 2;

function formatStatCount(value: number | string | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const thousands = n / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return String(Math.round(n));
}

function formatLocationLabel(
  location: AccountLocationDTO | BusinessLocation | null | undefined,
): string {
  if (!location) return '';
  return location.city || location.region || location.country || '';
}

function CompactStatsRow({
  items,
  className,
}: {
  items: CompactStatItem[];
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-baseline', className)}>
      {items.map((item, index) => {
        const content = (
          <Text className="font-geist text-[13px] text-gray-400 dark:text-dk-faint">
            <Text className="font-geist-bold text-ink dark:text-dk-text">
              {item.value}
            </Text>
            {` ${item.label}`}
          </Text>
        );

        return (
          <View
            key={`${item.label}-${index}`}
            className="min-w-0 flex-1 items-center"
          >
            {item.onPress ? (
              <Pressable
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${item.value} ${item.label}`}
                className="active:opacity-70"
                hitSlop={6}
              >
                {content}
              </Pressable>
            ) : (
              content
            )}
          </View>
        );
      })}
    </View>
  );
}

function ExpandableBio({ bio }: { bio: string }) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  // Match MainProfile page background so the fade + "more" chip blend in.
  const fadeColors = isDark
    ? (['rgba(22, 20, 18, 0)', 'rgba(22, 20, 18, 1)'] as const)
    : (['rgba(247, 243, 236, 0)', 'rgba(247, 243, 236, 1)'] as const);

  useEffect(() => {
    setExpanded(false);
    setCanExpand(false);
  }, [bio]);

  return (
    <View className="mt-3">
      <Text
        className="absolute left-0 right-0 font-geist text-sm leading-[1.45] opacity-0"
        pointerEvents="none"
        onTextLayout={(event) => {
          const next = event.nativeEvent.lines.length > BIO_COLLAPSE_LINES;
          setCanExpand((prev) => (prev === next ? prev : next));
        }}
      >
        {bio}
      </Text>
      <View className="relative">
        <Text
          className="font-geist text-sm leading-[1.45] text-ink dark:text-dk-text"
          numberOfLines={expanded ? undefined : BIO_COLLAPSE_LINES}
        >
          {bio}
        </Text>
        {canExpand && !expanded ? (
          <View
            pointerEvents="box-none"
            className="absolute bottom-0 right-0 flex-row items-end"
          >
            <LinearGradient
              colors={[...fadeColors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: 28, height: 18 }}
            />
            <Pressable
              onPress={() => setExpanded(true)}
              accessibilityRole="button"
              hitSlop={6}
              className="bg-page pl-0.5 active:opacity-70 dark:bg-dk-page"
            >
              <Text className="font-geist-bold text-sm text-ink dark:text-dk-text">
                {t('profile.info.bioMore')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {canExpand && expanded ? (
        <Pressable
          onPress={() => setExpanded(false)}
          accessibilityRole="button"
          hitSlop={6}
          className="mt-0.5 self-start active:opacity-70"
        >
          <Text className="font-geist-bold text-sm text-ink dark:text-dk-text">
            {t('profile.info.bioLess')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BusinessProfileInfo({
  business,
  isOwnProfile = false,
}: {
  business: BusinessItemDAO;
  isOwnProfile?: boolean;
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';
  const mutedIconColor = isDark ? '#A79E92' : '#9EA4AF';
  const iconBrand = brandColor(isDark);
  const [isAvatarFullScreenVisible, setIsAvatarFullScreenVisible] =
    useState(false);
  const [isLiked, setIsLiked] = useState(business.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(business.like_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const avatarImageUri = resolveImageUrl(business.logo);

  useEffect(() => {
    setIsLiked(business.is_liked ?? false);
    setLikeCount(business.like_count ?? 0);
  }, [business.id, business.is_liked, business.like_count]);

  const locationLabel = formatLocationLabel(
    business.branches?.[0]?.location ?? business.location,
  );

  const patchBusinessCache = useCallback(
    (nextLiked: boolean, nextCount: number) => {
      queryClient.setQueryData<BusinessItemDAO | null>(
        ['business', business.id],
        (previous) =>
          previous
            ? { ...previous, is_liked: nextLiked, like_count: nextCount }
            : previous,
      );
    },
    [business.id, queryClient],
  );

  const handleLike = useCallback(async () => {
    if (isLiking || isOwnProfile) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    const nextCount = nextLiked
      ? previousCount + 1
      : Math.max(0, previousCount - 1);

    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    patchBusinessCache(nextLiked, nextCount);

    try {
      const response = nextLiked
        ? await businessService.likeBusiness(business.id)
        : await businessService.unlikeBusiness(business.id);
      if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      console.error('Failed to toggle business like:', error);
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      patchBusinessCache(previousLiked, previousCount);
    } finally {
      setIsLiking(false);
    }
  }, [
    business.id,
    isLiked,
    isLiking,
    isOwnProfile,
    likeCount,
    patchBusinessCache,
  ]);

  const stats: CompactStatItem[] = useMemo(
    () => [
      {
        value: formatStatCount(business.list_count),
        label: t('profile.info.stats.lists'),
      },
      {
        value: formatStatCount(business.follower_count),
        label: t('profile.info.stats.followers'),
      },
      {
        value: formatStatCount(likeCount),
        label: t('profile.info.stats.likes'),
      },
      {
        value: formatStatCount(business.share_count),
        label: t('profile.info.stats.shares'),
      },
    ],
    [business.follower_count, business.list_count, business.share_count, likeCount, t],
  );

  return (
    <>
      <View className="relative px-4 pb-1 pt-2">
        <View className="flex-row items-center gap-3.5">
          <Avatar
            name={business.name}
            src={business.logo}
            size="md2"
            onPress={
              avatarImageUri
                ? () => setIsAvatarFullScreenVisible(true)
                : undefined
            }
          />

          <View className="min-w-0 flex-1">
            <Text
              className="font-geist-extrabold text-[22px] leading-7 tracking-tight text-ink dark:text-dk-text"
              numberOfLines={2}
            >
              {business.name}
            </Text>

            {business.business_type ? (
              <Text
                className="mt-0.5 font-fraunces text-[15px] italic text-gray-500 dark:text-dk-muted"
                numberOfLines={1}
              >
                {business.business_type}
              </Text>
            ) : null}
          </View>

          {!isOwnProfile ? (
            <Pressable
              onPress={() => void handleLike()}
              disabled={isLiking}
              accessibilityRole="button"
              accessibilityLabel={
                isLiked ? t('listDetail.liked') : t('listDetail.like')
              }
              accessibilityState={{ disabled: isLiking, selected: isLiked }}
              className="cursor-pointer items-center justify-center rounded-full bg-gray-100 p-2.5 active:opacity-70 dark:bg-dk-elevated"
              hitSlop={4}
            >
              <Heart
                size={18}
                color={isLiked ? iconBrand : mutedIconColor}
                fill={isLiked ? iconBrand : 'transparent'}
              />
            </Pressable>
          ) : null}
        </View>

        <CompactStatsRow items={stats} className="mt-4" />

        {business.bio ? <ExpandableBio bio={business.bio} /> : null}

        {locationLabel ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <MapPin size={12} color={mutedIconColor} />
            <Text
              className="font-geist-medium text-[12.5px] text-gray-400 dark:text-dk-faint"
              numberOfLines={1}
            >
              {locationLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {avatarImageUri ? (
        <ImageFullScreen
          uri={avatarImageUri}
          visible={isAvatarFullScreenVisible}
          onClose={() => setIsAvatarFullScreenVisible(false)}
        />
      ) : null}
    </>
  );
}

function UserProfileInfo({
  profile,
  isOwnProfile,
}: {
  profile: profileItemDAO;
  isOwnProfile: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const authAccountType = useAuthStore((s) => s.accountType);
  const accountType = profile.account_type ?? authAccountType ?? undefined;
  const gradientColors = getPersonalityGradientColors(profile.personality_color);
  const accentColor = getDominantPersonalityColor(profile.personality_color);
  const [isAvatarFullScreenVisible, setIsAvatarFullScreenVisible] =
    useState(false);
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [followModalTab, setFollowModalTab] =
    useState<FollowListTab>('followers');
  const avatarImageUri = resolveImageUrl(profile.profile_image_url);
  const {
    matchPercent,
    tasteMatchBlurb,
    isLoading: isMatchLoading,
  } = useSimilarScores(profile.id ?? '', !isOwnProfile && Boolean(profile.id));
  const {
    showBusinessSections,
    listCount: featuredListCount,
    monthDelta,
    topTypes,
  } = useBusinessOwnerProfileInsights(isOwnProfile, accountType);
  const showTasteMatch = !isOwnProfile && !isMatchLoading && matchPercent != null;
  const matchColor = getMatchPercentColor(matchPercent ?? 0);

  const stats: CompactStatItem[] = useMemo(
    () => [
      {
        value: formatStatCount(profile.list_count),
        label: t('profile.info.stats.lists'),
      },
      {
        value: formatStatCount(profile.followers_count),
        label: t('profile.info.stats.followers'),
        onPress: profile.id
          ? () => {
              setFollowModalTab('followers');
              setFollowModalVisible(true);
            }
          : undefined,
      },
      {
        value: formatStatCount(profile.followed_count),
        label: t('profile.info.stats.following'),
        onPress: profile.id
          ? () => {
              setFollowModalTab('following');
              setFollowModalVisible(true);
            }
          : undefined,
      },
      {
        value: formatStatCount(profile.total_likes),
        label: t('profile.info.stats.saves'),
      },
    ],
    [
      profile.followed_count,
      profile.followers_count,
      profile.id,
      profile.list_count,
      profile.total_likes,
      t,
    ],
  );

  const labels = resolveUserLabels(profile, t('common.user'));
  const blurb = tasteMatchBlurb ?? t('profile.info.tasteMatchBlurb');

  return (
    <>
      <View className="relative px-4 pb-1 pt-2">
        <View className="flex-row items-center gap-3.5">
          <Avatar
            name={labels.primary}
            src={profile.profile_image_url}
            size="md2"
            gradientColors={gradientColors}
            onPress={
              avatarImageUri
                ? () => setIsAvatarFullScreenVisible(true)
                : undefined
            }
          />

          <View className="min-w-0 flex-1">
            {labels.secondary ? (
              <Text
                className="font-geist-extrabold text-[22px] leading-7 tracking-tight text-ink dark:text-dk-text"
                numberOfLines={2}
              >
                {labels.secondary}
              </Text>
            ) : null}

            {profile.personality_name ? (
              <View className="mt-0.5 flex-row items-center gap-1.5">
                <View
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <Text
                  className="shrink font-fraunces text-[15px] italic"
                  style={{ color: accentColor }}
                  numberOfLines={1}
                >
                  {profile.personality_name}
                </Text>
              </View>
            ) : null}
            {profile.personality_name && isInferredPersonality(profile.personality_source) ? (
              <Text className="mt-0.5 font-geist-medium text-[11.5px] text-gray-400 dark:text-dk-faint">
                {t('personality.basedOnActivity')}
              </Text>
            ) : null}
            {isOwnProfile && isInferredPersonality(profile.personality_source) ? (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/personality', params: { isRetake: 'true' } })
                }
                className="mt-1 cursor-pointer"
              >
                <Text className="font-geist-semibold text-[12.5px] text-brand dark:text-dk-text">
                  {t('personality.takeQuizCta')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <CompactStatsRow items={stats} className="mt-4" />

        {profile.bio ? <ExpandableBio bio={profile.bio} /> : null}

        {showTasteMatch ? (
          <Text className="mt-2.5 font-geist text-[13px] leading-[1.4]">
            <Text className="font-geist-bold" style={{ color: matchColor }}>
              {t('home.forYou.tasteMatch', { percent: matchPercent ?? 0 })}
            </Text>
            <Text className="text-gray-400 dark:text-dk-faint">
              {' · '}
              {blurb}
            </Text>
          </Text>
        ) : null}

        {showBusinessSections ? (
          <>
            <BusinessHomeRow />
            <FeaturedInCard
              listCount={featuredListCount}
              monthDelta={monthDelta}
              topTypes={topTypes}
            />
          </>
        ) : null}
      </View>

      {avatarImageUri ? (
        <ImageFullScreen
          uri={avatarImageUri}
          visible={isAvatarFullScreenVisible}
          onClose={() => setIsAvatarFullScreenVisible(false)}
        />
      ) : null}

      {profile.id ? (
        <FollowersFollowingModal
          visible={followModalVisible}
          onClose={() => setFollowModalVisible(false)}
          userId={profile.id}
          initialTab={followModalTab}
          isOwnProfile={isOwnProfile}
        />
      ) : null}
    </>
  );
}

export function ProfileInfo({
  profile,
  business,
  isOwnProfile = true,
}: ProfileInfoProps) {
  if (business) {
    return (
      <BusinessProfileInfo
        business={business}
        isOwnProfile={Boolean(isOwnProfile)}
      />
    );
  }

  if (!profile) return null;

  return (
    <UserProfileInfo
      profile={profile}
      isOwnProfile={isOwnProfile}
    />
  );
}
