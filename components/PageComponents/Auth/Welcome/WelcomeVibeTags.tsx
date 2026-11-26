import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WelcomeFrostedSurface } from './WelcomeFrostedSurface';

type WelcomeVibeTagsProps = {
  tagKeys: string[];
};

export function WelcomeVibeTags({ tagKeys }: WelcomeVibeTagsProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-2.5 flex-row flex-wrap gap-1.5">
      {tagKeys.map((key) => (
        <WelcomeFrostedSurface key={key} radius={999} intensity={24}>
          <Text className="px-[11px] py-1.5 font-geist-medium text-[12px] leading-4 text-[#F3EBDD]">
            {t(key)}
          </Text>
        </WelcomeFrostedSurface>
      ))}
    </View>
  );
}
