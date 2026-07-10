import { Image, Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bookmark, Navigation, Share2 } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useListFormStore } from '@/stores/useListFormStore';
import { useToastStore } from '@/stores/useToastStore';
import { mapSmartPickResultToPickDraft } from '@/utils/listPickMappers';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { getPersonalityGradientColors } from '@/utils/personalityRing';
import { openInMaps } from '@/utils/smartPick';
import type { ConversationResult } from '@/http/smart-pick-api/types';
import { SmartPickMatchPill } from './SmartPickMatchPill';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useColorScheme } from 'nativewind';

interface SmartPickHeroProps {
  result: ConversationResult;
  isStretch: boolean;
  /** Defaults to "Your pick" for the top result; pass a custom label for an expanded backup. */
  eyebrow?: string;
}

export function SmartPickHero({ result, isStretch, eyebrow }: SmartPickHeroProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const pick = result.pick;

  const name = pick?.business?.name ?? pick?.unverified_business?.name ?? 'Unnamed place';
  const category = pick?.business?.business_type;
  const city = pick?.location?.city;
  const photoUrl = resolveImageUrl(pick?.images[0]?.url);
  const reasonText = result.description || pick?.description;
  const reasonEyebrow = t(isStretch ? 'smartPick.whyThisStretches' : 'smartPick.whyThisMatch');
  const accentTextClass = isStretch ? 'text-connector' : 'text-brand-dark';
  const reasonBoxClass = isStretch ? 'bg-connector-tint dark:bg-connector-tint/5' : 'bg-cream dark:bg-gray-800';
  const ctaColorClass = isStretch ? 'bg-connector' : 'bg-brand';
  const { colorScheme } = useColorScheme();

  const handleTakeMeThere = () => {
    if (!pick?.location) {
      showToast({ type: 'info', message: t('smartPick.noDirections') });
      return;
    }
    openInMaps(pick.location.latitude, pick.location.longitude, name);
  };

  const handleSaveToList = () => {
    const { reset, setItems } = useListFormStore.getState();
    reset();
    setItems([mapSmartPickResultToPickDraft(result)]);
    router.push('/(app)/(stack)/lists/new' as never);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: reasonText ? `${name} — ${reasonText}` : name,
      });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  return (
    <View className="overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {photoUrl ? (
        <View className="relative h-[180px] w-full bg-soft dark:bg-gray-800">
          <Image source={{ uri: photoUrl }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute right-3 top-3">
            <SmartPickMatchPill percent={result.match_percentage} isStretch={isStretch} />
          </View>
        </View>
      ) : null}

      <View className="gap-3 px-4 pb-4 pt-4">
        <View className="flex-row items-center justify-between gap-2">
          <Text className={`font-geist-bold text-[9.5px] uppercase tracking-[0.16em] ${accentTextClass}`}>
            {eyebrow ?? t('smartPick.yourPick')}
          </Text>
          {!photoUrl ? (
            <SmartPickMatchPill percent={result.match_percentage} isStretch={isStretch} />
          ) : null}
        </View>

        <View className="gap-1">
          <Text className="font-geist-semibold text-2xl text-ink dark:text-gray-100">{name}</Text>
          {category || city ? (
            <Text className="font-geist text-[12.5px] text-gray-400 dark:text-gray-500">
              {[category, city].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        {reasonText ? (
          <View className={`rounded-xl px-3.5 py-3 ${reasonBoxClass}`}>
            <Text className={`mb-1 font-geist-bold text-[9.5px] uppercase tracking-[0.14em] ${accentTextClass}`}>
              {reasonEyebrow}
            </Text>
            <Text className="font-fraunces text-[13.5px] italic leading-[1.5] text-ink dark:text-gray-100">
              {reasonText}
            </Text>
          </View>
        ) : null}

        {pick?.tags && pick.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {pick.tags.map((tag) => (
              <Badge key={tag.id} label={tag.name} variant="secondary" />
            ))}
          </View>
        ) : null}

        {pick?.user ? (
          <View className="flex-row items-center gap-2">
            <Avatar
              name={pick.user.name}
              src={pick.user.profile_image_url ?? undefined}
              size="xs"
              gradientColors={getPersonalityGradientColors(
                pick.user.personality_color as Record<string, number> | null,
              )}
            />
            <Text className="font-geist text-[11.5px] text-gray-500 dark:text-gray-400">
              {t('smartPick.curatedBy', { name: pick.user.name })}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-2 pt-1">
          <LocalNotesButton
            label={t(isStretch ? 'smartPick.takeChance' : 'smartPick.takeMeThere')}
            onPress={handleTakeMeThere}
            variant="brand"
            size="md"
            leftIcon={<Navigation size={15} color="#fff" />}
            isRounded
            className="flex-1"
            isWidthFull={false}
          />
          <LocalNotesButton
            label=""
            onPress={handleSaveToList}
            variant="light"
            size="md"
            leftIcon={
              <Bookmark
                size={17}
                color={colorScheme === 'dark' ? '#FFF' : '#191B1C'}
              />
            }
            isRounded
            isWidthFull={false}
          />
          <LocalNotesButton
            label=""
            onPress={() => void handleShare()}
            variant="light"
            size="md"
            leftIcon={
              <Share2
                size={17}
                color={colorScheme === 'dark' ? '#FFF' : '#191B1C'}
              />
            }
    
            isRounded
            isWidthFull={false}
          />
  
        </View>
      </View>
    </View>
  );
}
