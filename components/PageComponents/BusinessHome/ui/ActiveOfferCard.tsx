import { Image, Pressable, Text, View } from 'react-native';
import {
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Play,
  Share2,
  Tag,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { WhiteBox } from '@/components/ui/WhiteBox';
import type { OfferCardItem } from '@/types/offer';
import { isOthersCategoryName } from '@/utils/listCategories';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { getTimeLeftLabel } from '@/utils/time';

interface ActiveOfferCardProps {
  offer: OfferCardItem;
  onPress: () => void;
}

export function ActiveOfferCard({ offer, onPress }: ActiveOfferCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconMuted = colorScheme === 'dark' ? '#9CA3AF' : '#57534E';

  const imageUri = offer.imageUrl ? resolveImageUrl(offer.imageUrl) : null;
  const hasVideoOnly = !imageUri && Boolean(offer.videoUrl);
  const untilLabel = offer.expiresAt ? getTimeLeftLabel(offer.expiresAt) : '';
  const isLessThanADay = untilLabel.includes('left');
  const categoryLabel = offer.categories?.length
    ? offer.categories
        .map((category) =>
          isOthersCategoryName(category) ? (offer.others_name ?? category) : category,
        )
        .join(' · ')
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${offer.title ?? ''} ${t('businessHome.campaignsTab.viewDetails')}`.trim()}
      className="mx-4 active:opacity-80"
    >
      <WhiteBox className="p-0">
        <View className="flex-row gap-3 p-3">
          <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-brand-tint dark:bg-brand/20">
            {imageUri ? (
              <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
            ) : hasVideoOnly ? (
              <View className="h-full w-full items-center justify-center bg-ink">
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            ) : (
              <Tag size={22} color="#FF6B1A" />
            )}
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex-row items-start gap-2">
              <Text
                className="flex-1 font-geist-bold text-[15px] leading-5 text-ink dark:text-gray-100"
                numberOfLines={2}
              >
                {offer.title}
              </Text>
              <ChevronRight size={16} color={iconMuted} />
            </View>
            <Text
              className="mt-0.5 font-geist text-[13px] leading-[18px] text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {offer.content ?? t('offers.noDetails')}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
              <Badge label={t('businessHome.campaignsTab.active')} variant="success" />
              {categoryLabel ? <Badge label={categoryLabel} variant="secondary" /> : null}
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-3 border-t border-gray-100 px-3 py-2.5 dark:border-gray-800">
          <View className="flex-row items-center gap-1.5">
            <Eye size={13} color={iconMuted} />
            <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
              {offer.views}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Heart size={13} color={iconMuted} />
            <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
              {offer.likes}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Share2 size={13} color={iconMuted} />
            <Text className="font-geist-semibold text-[12.5px] text-gray-500 dark:text-gray-400">
              {offer.shares}
            </Text>
          </View>

          <View className="flex-1" />

          <View className="max-w-[45%] flex-row items-center gap-1.5">
            {isLessThanADay ? (
              <Clock size={13} color="#de4f2d" />
            ) : (
              <Calendar size={13} color={iconMuted} />
            )}
            <Text
              className={`font-geist-semibold text-[12.5px] ${
                isLessThanADay ? 'text-[#de4f2d]' : 'text-gray-500 dark:text-gray-400'
              }`}
              numberOfLines={1}
            >
              {untilLabel || t('offers.noExpiration')}
            </Text>
          </View>
        </View>
      </WhiteBox>
    </Pressable>
  );
}
