import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { MapPin, Upload } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { FollowButton } from '@/components/ui/FollowButton';
import { ImageFullScreen } from '@/components/ui/ImageFullScreen';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import {
  getDominantPersonalityColor,
  getPersonalityGradientColors,
} from '@/utils/personalityRing';
import { resolveImageUrl } from '@/utils/httpHelpers';
import type { AccountLocationDTO, profileItemDAO } from '@/http/account-api/types';

interface ProfileInfoProps {
  profile: profileItemDAO;
  isOwnProfile?: boolean;
  onEditPress: () => void;
  onSharePress: () => void;
}

interface StatItem {
  value: string;
  label: string;
}

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

function formatLocationLabel(location: AccountLocationDTO | null | undefined): string {
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

export function ProfileInfo({
  profile,
  isOwnProfile = true,
  onEditPress,
  onSharePress,
}: ProfileInfoProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const gradientColors = getPersonalityGradientColors(profile.personality_color);
  const accentColor = getDominantPersonalityColor(profile.personality_color);
  const mutedIconColor = isDark ? '#9CA3AF' : '#A8A29E';
  const shareIconColor = isDark ? '#F3F4F6' : '#1C1917';
  const [isAvatarFullScreenVisible, setIsAvatarFullScreenVisible] =
    useState(false);
  const avatarImageUri = resolveImageUrl(profile.profile_image_url);

  const locationLabel = formatLocationLabel(profile.location);
  const joinedYear = formatJoinedYear(profile.created_at);

  const locationLine = useMemo(() => {
    if (locationLabel && joinedYear) {
      return t('profile.info.locationJoined', {
        location: locationLabel,
        year: joinedYear,
      });
    }
    if (locationLabel) return locationLabel;
    if (joinedYear) return t('profile.info.joined', { year: joinedYear });
    return '';
  }, [joinedYear, locationLabel, t]);

  const stats: StatItem[] = useMemo(
    () => [
      {
        value: formatStatCount(profile.list_count),
        label: t('profile.info.stats.lists'),
      },
      {
        value: formatStatCount(profile.followers_count),
        label: t('profile.info.stats.followers'),
      },
      {
        value: formatStatCount(profile.followed_count),
        label: t('profile.info.stats.following'),
      },
      {
        value: formatStatCount(profile.total_likes),
        label: t('profile.info.stats.saves'),
      },
    ],
    [
      profile.followed_count,
      profile.followers_count,
      profile.list_count,
      profile.total_likes,
      t,
    ],
  );

  return (
    <>
      <View className="relative px-4 pb-1 mt-5">
        <LinearGradient
          colors={[hexToRgba(accentColor, 0.05), 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: -70,
            left: -16,
            right: -16,
            height: 200,
          }}
          pointerEvents="none"
        />

        <View className="relative items-center px-2 -mt-4">
          <Avatar
            name={profile.name}
            src={profile.profile_image_url}
            size="xl"
            gradientColors={gradientColors}
            onPress={
              avatarImageUri
                ? () => setIsAvatarFullScreenVisible(true)
                : undefined
            }
          />

          <Text
            className="mt-3 text-center font-geist-extrabold text-[23px] leading-7 tracking-tight text-ink dark:text-gray-100"
            numberOfLines={2}
          >
            {profile.name}
          </Text>

          {profile.personality_name ? (
            <Text
              className="mt-0.5 text-center font-fraunces text-base italic"
              style={{ color: accentColor }}
              numberOfLines={1}
            >
              {profile.personality_name}
            </Text>
          ) : null}

          {profile.bio ? (
            <Text className="mt-2 max-w-[300px] text-center font-geist text-sm leading-[1.45] text-gray-600 dark:text-gray-400">
              {profile.bio}
            </Text>
          ) : null}

          {locationLine ? (
            <View className="mt-1.5 flex-row items-center gap-1">
              <MapPin size={12} color={mutedIconColor} />
              <Text
                className="font-geist-medium text-[12.5px] text-gray-400 dark:text-gray-500"
                numberOfLines={1}
              >
                {locationLine}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-4 flex-row rounded-2xl bg-white py-3 shadow-sm dark:bg-gray-800">
          {stats.map((stat, index) => (
            <View
              key={stat.label}
              className={`flex-1 items-center ${
                index > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''
              }`}
            >
              <Text className="font-geist-extrabold text-[17px] text-ink dark:text-gray-100">
                {stat.value}
              </Text>
              <Text className="mt-0.5 font-geist-semibold text-[11.5px] uppercase text-gray-400 dark:text-gray-500">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-3.5 flex-row items-center gap-2.5 px-0 pb-1">
          {isOwnProfile ? (
            <LocalNotesButton
              label={t('profile.info.editProfile')}
              onPress={onEditPress}
              variant="dark"
              isRounded
              isWidthFull={false}
              className="flex-1 justify-center"
            />
          ) : profile.id ? (
            <View className="min-h-[46px] flex-1 justify-center">
              <FollowButton
                userId={profile.id}
                initialIsFollowed={Boolean(profile.is_followed)}
                useButton
                isButtonFull
              />
            </View>
          ) : (
            <View className="flex-1" />
          )}

          <LocalNotesButton
            label=""
            onPress={onSharePress}
            variant="light"
            isRounded
            isWidthFull={false}
            leftIcon={<Upload size={17} color={shareIconColor} strokeWidth={2.2} />}
          />
    
        </View>
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
