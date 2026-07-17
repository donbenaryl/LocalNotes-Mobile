import { useState } from 'react';
import { Text, View } from 'react-native';
import { BadgeCheck, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { FollowButton } from '@/components/ui/FollowButton';
import { ImageFullScreen } from '@/components/ui/ImageFullScreen';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { PersonalityName } from '@/components/ui/PersonalityName';
import { getPersonalityGradientColors } from '@/utils/personalityRing';
import { resolveImageUrl } from '@/utils/httpHelpers';
import type { AccountLocationDTO, profileItemDAO } from '@/http/account-api/types';

interface ProfileInfoProps {
  profile: profileItemDAO;
  isOwnProfile?: boolean;
  onEditPress: () => void;
  onSharePress: () => void;
}

function formatFullAddress(location: AccountLocationDTO): string {
  const cityLine = [location.city, location.region].filter(Boolean).join(', ');
  return [
    location.street_address,
    [cityLine, location.postal_code].filter(Boolean).join(' '),
    location.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function ProfileInfo({
  profile,
  isOwnProfile = true,
  onEditPress,
  onSharePress,
}: ProfileInfoProps) {
  const { t } = useTranslation();
  const gradientColors = getPersonalityGradientColors(profile.personality_color);
  const [isAvatarFullScreenVisible, setIsAvatarFullScreenVisible] =
    useState(false);
  const avatarImageUri = resolveImageUrl(profile.profile_image_url);

  const fullAddress = profile.location
    ? formatFullAddress(profile.location)
    : '';

  return (
    <>
      <View className="px-6 pb-4 gap-4">
      <View className="flex-row items-center gap-4">
        <Avatar
          name={profile.name}
          src={profile.profile_image_url}
          size="lg"
          gradientColors={gradientColors}
          onPress={
            avatarImageUri
              ? () => setIsAvatarFullScreenVisible(true)
              : undefined
          }
        />
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-1.5">
            <Text
              className="font-geist-bold text-xl text-ink dark:text-gray-100"
              numberOfLines={1}
            >
              {profile.name}
            </Text>
            <BadgeCheck size={20} color="white" fill="#3B82F6" />
          </View>
          {profile.personality_name ? (
            <PersonalityName
              name={profile.personality_name}
              personalityColor={profile.personality_color}
            />
          ) : null}
          {fullAddress ? (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color="#9CA3AF" />
              <Text
                className="font-geist text-xs text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {fullAddress}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {profile.bio ? (
        <Text className="font-geist text-lg text-gray-600 dark:text-gray-400 leading-5">
          {profile.bio}
        </Text>
      ) : null}

      <View className="flex-row gap-5">
        <Text className="font-geist text-md text-ink dark:text-gray-100">
          <Text className="font-geist-bold text-xl">{profile.list_count ?? 0}</Text>
          {' Lists'}
        </Text>
        <Text className="font-geist text-md text-ink dark:text-gray-100">
          <Text className="font-geist-bold text-xl">{profile.followers_count}</Text>
          {' Followers'}
        </Text>
        <Text className="font-geist text-md text-ink dark:text-gray-100">
          <Text className="font-geist-bold text-xl">{profile.followed_count}</Text>
          {' Following'}
        </Text>
        <Text className="font-geist text-md text-ink dark:text-gray-100">
          <Text className="font-geist-bold text-xl">{profile.total_likes}</Text>
          {' Likes'}
        </Text>
      </View>

      <View className="flex-row gap-3">
        {isOwnProfile ? (
          <LocalNotesButton
            label="Edit profile"
            onPress={onEditPress}
            variant="dark"
            isRounded
            isWidthFull={false}
            className="flex-1"
            size="md"
          />
        ) : profile.id ? (
          <View className="flex-1 items-center justify-center">
            <FollowButton
              userId={profile.id}
              initialIsFollowed={Boolean(profile.is_followed)}
              useButton={true}
            />
          </View>
        ) : null}
        <LocalNotesButton
          label="Share profile"
          onPress={onSharePress}
          variant="light"
          isRounded
          isWidthFull={false}
          className="flex-1"
          size="md"
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
