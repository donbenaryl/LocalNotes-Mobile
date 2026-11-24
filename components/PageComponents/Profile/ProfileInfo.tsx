import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Calendar, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { ImageFullScreen } from '@/components/ui/ImageFullScreen';
import {
  StatsSection,
  type StatsSectionItem,
} from '@/components/ui/StatsSection';
import { BusinessHomeRow } from '@/components/PageComponents/Profile/BusinessHomeRow';
import { FeaturedInCard } from '@/components/PageComponents/Profile/FeaturedInCard';
import { FollowersFollowingModal } from '@/components/PageComponents/Profile/FollowersFollowingModal';
import { useBusinessOwnerProfileInsights } from '@/hooks/useBusinessOwnerProfileInsights';
import type { FollowListTab } from '@/hooks/useFollowList';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSimilarScores } from '@/hooks/useSimilarScores';
import {
  getDominantPersonalityColor,
  getPersonalityGradientColors,
} from '@/utils/personalityRing';
import { getMatchPercentColor } from '@/utils/matchScore';
import { isInferredPersonality } from '@/utils/personality';
import { resolveImageUrl } from '@/utils/httpHelpers';
import {
  hasRealName,
  resolveUserLabels,
} from '@/utils/userDisplayName';
import type { AccountLocationDTO, profileItemDAO } from '@/http/account-api/types';
import type { BusinessItemDAO, BusinessLocation } from '@/http/business-api/types';

interface ProfileInfoProps {
  profile?: profileItemDAO | null;
  business?: BusinessItemDAO | null;
  isOwnProfile?: boolean;
}

const BIO_COLLAPSE_LINES = 3;

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

function formatJoinedYear(createdAt?: string): string | null {
  if (!createdAt) return null;
  const year = new Date(createdAt).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

function formatLocationLabel(
  location: AccountLocationDTO | BusinessLocation | null | undefined,
): string {
  if (!location) return '';
  return location.city || location.region || location.country || '';
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(15, 139, 126, ${alpha})`;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ExpandableBio({ bio }: { bio: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  return (
    <View className="mt-3">
      <Text
        className="font-geist text-sm leading-[1.45] text-gray-600 dark:text-dk-body"
        numberOfLines={expanded ? undefined : BIO_COLLAPSE_LINES}
        onTextLayout={(event) => {
          if (expanded || truncated) return;
          if (event.nativeEvent.lines.length >= BIO_COLLAPSE_LINES) {
            setTruncated(true);
          }
        }}
      >
        {bio}
      </Text>
      {truncated ? (
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          accessibilityRole="button"
          hitSlop={6}
          className="mt-0.5 self-start active:opacity-70"
        >
          <Text className="font-geist-bold text-sm text-ink dark:text-dk-text">
            {expanded ? t('profile.info.bioLess') : t('profile.info.bioMore')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BusinessProfileInfo({
  business,
}: {
  business: BusinessItemDAO;
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mutedIconColor = isDark ? '#A79E92' : '#9EA4AF';
  const [isAvatarFullScreenVisible, setIsAvatarFullScreenVisible] =
    useState(false);
  const avatarImageUri = resolveImageUrl(business.logo);

  const locationLabel = formatLocationLabel(
    business.branches?.[0]?.location ?? business.location,
  );

  const stats: StatsSectionItem[] = useMemo(
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
        value: formatStatCount(business.share_count),
        label: t('profile.info.stats.shares'),
      },
    ],
    [business.follower_count, business.list_count, business.share_count, t],
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
        </View>

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

        <StatsSection items={stats} className="mt-4" />
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
  const { colorScheme } = useColorScheme();
  const authAccountType = useAuthStore((s) => s.accountType);
  const isDark = colorScheme === 'dark';
  const accountType = profile.account_type ?? authAccountType ?? undefined;
  const gradientColors = getPersonalityGradientColors(profile.personality_color);
  const accentColor = getDominantPersonalityColor(profile.personality_color);
  const mutedIconColor = isDark ? '#A79E92' : '#9EA4AF';
  const [isAvatarFullScreenVisible, setIsAvatarFullScreenVisible] =
    useState(false);
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [followModalTab, setFollowModalTab] =
    useState<FollowListTab>('followers');
  const avatarImageUri = resolveImageUrl(profile.profile_image_url);
  const { matchPercent, isLoading: isMatchLoading } = useSimilarScores(
    profile.id ?? '',
    !isOwnProfile && Boolean(profile.id),
  );
  const {
    showBusinessSections,
    listCount: featuredListCount,
    monthDelta,
    topTypes,
  } = useBusinessOwnerProfileInsights(isOwnProfile, accountType);
  const showTasteMatch = !isOwnProfile && !isMatchLoading && matchPercent != null;
  const matchColor = getMatchPercentColor(matchPercent ?? 0);

  const locationLabel = formatLocationLabel(profile.location);
  const joinedYear = formatJoinedYear(profile.created_at);

  const stats: StatsSectionItem[] = useMemo(
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
            {isOwnProfile && !hasRealName(profile) ? (
              <Pressable
                onPress={() => router.push('/edit-profile' as never)}
                className="mt-1 cursor-pointer"
              >
                <Text className="font-geist-medium text-[12.5px] text-brand dark:text-dk-text">
                  {t('profile.info.addNameCta')}
                </Text>
              </Pressable>
            ) : null}

            {profile.personality_name ? (
              <Text
                className="mt-0.5 font-fraunces text-[15px] italic"
                style={{ color: accentColor }}
                numberOfLines={1}
              >
                {profile.personality_name}
              </Text>
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

        {profile.bio ? <ExpandableBio bio={profile.bio} /> : null}

        {joinedYear || locationLabel ? (
          <View className="mt-2 gap-1">
            {joinedYear ? (
              <View className="flex-row items-center gap-1.5">
                <Calendar size={12} color={mutedIconColor} />
                <Text className="font-geist-medium text-[12.5px] text-gray-400 dark:text-dk-faint">
                  {t('profile.info.joined', { year: joinedYear })}
                </Text>
              </View>
            ) : null}
            {locationLabel ? (
              <View className="flex-row items-center gap-1.5">
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
        ) : null}

        <StatsSection items={stats} className="mt-4" />

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

        {showTasteMatch ? (
          <View className="mt-3 flex-row items-start gap-2.5 rounded-2xl border border-gray-200 bg-card px-3.5 py-3 dark:border-dk-border dark:bg-dk-card">
            <View
              className="mt-0.5 h-4 w-4 items-center justify-center rounded-full"
              style={{ backgroundColor: hexToRgba(matchColor, 0.2) }}
            >
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: matchColor }}
              />
            </View>
            <Text className="min-w-0 flex-1 font-geist text-[13px] leading-[1.4]">
              <Text
                className="font-geist-bold"
                style={{ color: matchColor }}
              >
                {t('home.forYou.tasteMatch', { percent: matchPercent ?? 0 })}
              </Text>
              <Text className="text-gray-600 dark:text-dk-muted">
                {' — '}
                {t('profile.info.tasteMatchBlurb')}
              </Text>
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
    return <BusinessProfileInfo business={business} />;
  }

  if (!profile) return null;

  return (
    <UserProfileInfo
      profile={profile}
      isOwnProfile={isOwnProfile}
    />
  );
}
