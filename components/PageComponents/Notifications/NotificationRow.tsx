import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Bookmark,
  Heart,
  Sparkles,
  UserPlus,
  Eye,
  Bell,
  Building2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import type { notificationItemDAO } from '@/http/account-api/types';
import { formatRelativeTime } from '@/utils/time';

interface NotificationRowProps {
  item: notificationItemDAO;
  onPress: (item: notificationItemDAO) => void;
}

interface BadgeConfig {
  icon: LucideIcon;
  bgClass: string;
  label?: string;
}

function getBadgeConfig(type: string): BadgeConfig {
  switch (type) {
    case 'LIST_WAS_SAVED':
      return { icon: Bookmark, bgClass: 'bg-emerald-700' };
    case 'LIST_WAS_LIKED':
      return { icon: Heart, bgClass: 'bg-rose-600' };
    case 'NEW_FOLLOWER':
      return { icon: UserPlus, bgClass: 'bg-violet-600' };
    case 'SPOTLIGHT_FEATURED':
      return { icon: Sparkles, bgClass: 'bg-brand' };
    case 'BUSINESS_VIEWED':
      return { icon: Eye, bgClass: 'bg-brand' };
    case 'BUSINESS_CLAIM_APPROVED':
      return { icon: Building2, bgClass: 'bg-emerald-700' };
    case 'BUSINESS_CLAIM_REJECTED':
      return { icon: Building2, bgClass: 'bg-rose-600' };
    default:
      return { icon: Bell, bgClass: 'bg-gray-600' };
  }
}

export function NotificationRow({ item, onPress }: NotificationRowProps) {
  const { t } = useTranslation();
  const accountName =
    item.related_account?.name ?? t('notifications.actions.someone');
  const listName =
    item.related_list?.name ?? t('notifications.actions.aList');
  const badge = getBadgeConfig(item.notification_type);
  const BadgeIcon = badge.icon;
  const unread = !item.is_read;

  const actionPhrase = (() => {
    switch (item.notification_type) {
      case 'LIST_WAS_SAVED':
        return t('notifications.actions.savedYourList');
      case 'LIST_WAS_LIKED':
        return t('notifications.actions.likedYourList');
      case 'NEW_FOLLOWER':
        return t('notifications.actions.startedFollowing');
      case 'SPOTLIGHT_FEATURED':
        return t('notifications.actions.spotlightFeatured');
      case 'BUSINESS_VIEWED':
        return t('notifications.actions.businessViewed');
      default:
        return t('notifications.actions.fallback');
    }
  })();

  const showListTitle =
    !!item.related_list?.name &&
    (item.notification_type === 'LIST_WAS_SAVED' ||
      item.notification_type === 'LIST_WAS_LIKED' ||
      item.notification_type === 'SPOTLIGHT_FEATURED');

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      className={`flex-row items-start gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800 cursor-pointer ${
        unread ? 'bg-orange-50/40 dark:bg-orange-950/20' : ''
      }`}
    >
      <View className="relative mt-0.5 w-2 shrink-0 items-center">
        {unread ? <View className="mt-3 h-1.5 w-1.5 rounded-full bg-brand" /> : null}
      </View>

      <View className="relative shrink-0">
        <Avatar
          name={accountName}
          src={item.related_account?.profile_image ?? undefined}
          size="md"
        />
      </View>

      <View className="min-w-0 flex-1">
        {item.text ? (
          <Text className="font-geist text-[13px] leading-5 text-ink dark:text-gray-100">
            {item.text}
          </Text>
        ) : (
          <Text className="font-geist text-[13px] leading-5 text-ink dark:text-gray-100">
            <Text className="font-geist-bold">{accountName}</Text>
            {item.notification_type === 'SPOTLIGHT_FEATURED' ? (
              <>
                {', '}
                {actionPhrase}
              </>
            ) : (
              <>
                {' '}
                {actionPhrase}
              </>
            )}
            {showListTitle ? (
              <>
                {' '}
                <Text className="font-geist-bold">{`"${listName}"`}</Text>
              </>
            ) : null}
          </Text>
        )}
        <Text className="mt-1 font-geist text-[11px] text-gray-500 dark:text-gray-400">
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
