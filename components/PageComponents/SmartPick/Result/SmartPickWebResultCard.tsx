import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import { useListFormStore } from '@/stores/useListFormStore';
import { mapWebResultToPickDraft } from '@/utils/listPickMappers';
import { resolveImageUrl } from '@/utils/httpHelpers';
import type { WebResult } from '@/http/smart-pick-api/types';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';

interface SmartPickWebResultCardProps {
  webResult: WebResult;
}

/** A place from around the web (not yet curated in LocalNotes) surfaced near the user. */
export function SmartPickWebResultCard({ webResult }: SmartPickWebResultCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const photoUrl = resolveImageUrl(webResult.image_url);

  const handleSave = () => {
    const { reset, setItems } = useListFormStore.getState();
    reset();
    setItems([mapWebResultToPickDraft(webResult)]);
    router.push('/(app)/(stack)/lists/new' as never);
  };

  return (
    <View className="flex-row gap-3 rounded-2xl border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-gray-900">
      <View className="h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-soft dark:bg-gray-800">
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Globe size={18} color="#D1D5DB" />
        )}
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100" numberOfLines={1}>
          {webResult.name}
        </Text>
        {webResult.address ? (
          <Text className="font-geist text-[11px] text-gray-400 dark:text-gray-500" numberOfLines={1}>
            {webResult.address}
          </Text>
        ) : null}
        {webResult.why_it_fits ? (
          <Text
            className="font-fraunces text-[11px] italic text-gray-500 dark:text-gray-400"
            numberOfLines={2}
          >
            {webResult.why_it_fits}
          </Text>
        ) : null}
      </View>
      <LocalNotesButton
        label={t('smartPick.saveIt')}
        onPress={handleSave}
        size="xs"
        variant="brand"
        isRounded
        isWidthFull={false}
        className="shrink-0 self-center px-3 h-8"
      />

    </View>
  );
}
