import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { Sparkles } from 'lucide-react-native';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';

interface SmartPickNoResultsProps {
  resultLabel: string;
  isStretch: boolean;
  onTryAgain: () => void;
}

export function SmartPickNoResults({
  resultLabel,
  isStretch,
  onTryAgain,
}: SmartPickNoResultsProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const accentTextClass = isStretch ? 'text-connector' : 'text-brand-dark';
  const dotBgClass = isStretch ? 'bg-connector' : 'bg-brand';
  const iconColor = isStretch ? '#534AB7' : '#c2410c';
  const iconBgClass = isStretch ? 'bg-[#E8E6F4] dark:bg-gray-800' : 'bg-brand-tint dark:bg-gray-800';
  const gradientColors = isStretch
    ? isDark
      ? (['#1a1830', '#111827'] as const)
      : (['#E8E6F4', '#f5f4ef'] as const)
    : isDark
      ? (['#2a1a10', '#111827'] as const)
      : (['#FFF1E8', '#F3EBDD'] as const);

  return (
    <View className="gap-4">
      <View className="gap-1">
        <View className="flex-row items-center gap-1.5">
          <View className={`h-[5px] w-[5px] rotate-45 ${dotBgClass}`} />
          <Text
            className={`font-geist-bold text-[10.5px] uppercase tracking-[0.14em] ${accentTextClass}`}
          >
            {t(isStretch ? 'smartPick.outsideUsualEyebrow' : 'smartPick.forYouEyebrow')}
          </Text>
        </View>
        <Text className="font-geist-semibold text-[21px] leading-6 text-ink dark:text-gray-100">
          {resultLabel}
        </Text>
      </View>

      <View className="overflow-hidden rounded-[20px] border border-gray-200 dark:border-gray-800">
        <LinearGradient
          colors={[...gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 24, paddingVertical: 32 }}
        >
          <View className="items-center gap-5">
            <View className="relative">
              <View
                className={`h-[72px] w-[72px] items-center justify-center rounded-full border border-white/70 ${iconBgClass}`}
              >
                <Sparkles size={30} color={iconColor} strokeWidth={1.5} />
              </View>
              <View
                className={`absolute -right-1 top-0 h-2.5 w-2.5 rounded-full ${dotBgClass} opacity-50`}
              />
              <View
                className={`absolute -bottom-0.5 -left-1.5 h-2 w-2 rounded-full ${dotBgClass} opacity-30`}
              />
            </View>

            <View className="items-center gap-2.5">
              <Text className="text-center font-geist-semibold text-xl text-ink dark:text-gray-100">
                {t('smartPick.noResultsTitle')}
              </Text>
              <Text className="max-w-[280px] text-center font-fraunces text-[14px] italic leading-[1.55] text-gray-600 dark:text-gray-400">
                {t('smartPick.noResultsDetail')}
              </Text>
            </View>

            <LocalNotesButton
              label={t('smartPick.tryAgain')}
              onPress={onTryAgain}
              variant="brand"
              isRounded
              isWidthFull={false}
              size="sm"
              className="self-center"
              leftIcon={<Sparkles size={15} color="#fff" />}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
