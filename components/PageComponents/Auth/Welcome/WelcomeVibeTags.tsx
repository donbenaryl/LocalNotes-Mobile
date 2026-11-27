import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LNText } from '@/components/ui/LNText';
import { WelcomeFrostedSurface } from './WelcomeFrostedSurface';

type WelcomeVibeTagsProps = {
  tagKeys: string[];
  compact?: boolean;
};

export function WelcomeVibeTags({ tagKeys, compact = false }: WelcomeVibeTagsProps) {
  const { t } = useTranslation();

  return (
    <View className={`flex-row flex-wrap gap-1.5 ${compact ? 'mt-1.5' : 'mt-2.5'}`}>
      {tagKeys.map((key) => (
        <WelcomeFrostedSurface key={key} radius={999} intensity={24}>
          <LNText
            className={
              compact
                ? 'px-2.5 py-1 font-geist-medium text-[11px] leading-4 text-[#F3EBDD]'
                : 'px-[11px] py-1.5 font-geist-medium text-[12px] leading-4 text-[#F3EBDD]'
            }
          >
            {t(key)}
          </LNText>
        </WelcomeFrostedSurface>
      ))}
    </View>
  );
}
