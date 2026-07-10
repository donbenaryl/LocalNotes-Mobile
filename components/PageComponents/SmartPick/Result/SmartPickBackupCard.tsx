import { Image, Pressable, Text, View } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { resolveImageUrl } from '@/utils/httpHelpers';
import type { ConversationResult } from '@/http/smart-pick-api/types';
import { SmartPickMatchPill } from './SmartPickMatchPill';

interface SmartPickBackupCardProps {
  result: ConversationResult;
  isStretch: boolean;
  isExpanded: boolean;
  onPress: () => void;
}

export function SmartPickBackupCard({
  result,
  isStretch,
  isExpanded,
  onPress,
}: SmartPickBackupCardProps) {
  const pick = result.pick;
  const name = pick?.business?.name ?? pick?.unverified_business?.name ?? 'Unnamed place';
  const category = pick?.business?.business_type;
  const city = pick?.location?.city;
  const photoUrl = resolveImageUrl(pick?.images[0]?.url);
  const reasonText = result.description || pick?.description;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border p-2.5 cursor-pointer ${
        isExpanded
          ? isStretch
            ? 'border-connector bg-connector-tint dark:bg-connector-tint/5'
            : 'border-brand bg-brand-tint dark:bg-brand-tint/5'
          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <View className="h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-soft dark:bg-gray-800">
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <ImageOff size={18} color="#D1D5DB" />
        )}
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100" numberOfLines={1}>
          {name}
        </Text>
        {category || city ? (
          <Text className="font-geist text-[11px] text-gray-400 dark:text-gray-500" numberOfLines={1}>
            {[category, city].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {reasonText ? (
          <Text
            className="font-fraunces text-[11px] italic text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            "{reasonText}"
          </Text>
        ) : null}
      </View>

      <SmartPickMatchPill percent={result.match_percentage} isStretch={isStretch} compact />
    </Pressable>
  );
}
