import { Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { WelcomeSlideMidData } from '@/constants/welcomeScreens';
import { WELCOME_CREAM } from '@/constants/welcomeScreens';
import { WelcomeListCard } from './WelcomeListCard';
import { WelcomeMatchPill } from './WelcomeMatchPill';
import { WelcomeSmartPicksPreview } from './WelcomeSmartPicksPreview';
import { WelcomeVibeTags } from './WelcomeVibeTags';

type WelcomeSlideMidProps = {
  mid: WelcomeSlideMidData;
};

export function WelcomeSlideMid({ mid }: WelcomeSlideMidProps) {
  const { t } = useTranslation();
  const titleClass =
    mid.titleSize === 'lg'
      ? 'font-geist-semibold text-[27px] leading-8 tracking-[-0.01em] text-[#F3EBDD]'
      : 'font-geist-semibold text-[22px] leading-7 tracking-[-0.02em] text-[#F3EBDD]';

  const eyebrowMargin = mid.kind === 'smartpicks' ? 'mt-6 mb-1' : 'mt-[26px] mb-1.5';

  return (
    <View className="px-5" pointerEvents="box-none">
      <Text
        className={`font-geist-semibold text-[11px] uppercase leading-[14px] tracking-[0.12em] text-[rgba(243,235,221,0.82)] ${eyebrowMargin}`}
      >
        {t(mid.eyebrowKey)}
      </Text>

      <Text className={titleClass} maxFontSizeMultiplier={1.15}>
        {t(mid.titleKey)}
      </Text>

      {mid.kind === 'smartpicks' ? (
        <Text className="mt-1 font-geist text-base leading-[22px] text-[rgba(243,235,221,0.9)]">
          {t(mid.subtitleKey)}
        </Text>
      ) : null}

      {mid.kind === 'pick' ? (
        <View className="mt-2 flex-row items-center gap-1.5">
          <MapPin size={16} color={WELCOME_CREAM} strokeWidth={2} />
          <Text className="font-geist-semibold text-[15px] leading-5 text-[#F3EBDD]">
            {t(mid.placeNameKey)}
          </Text>
        </View>
      ) : null}

      {mid.kind === 'list' || mid.kind === 'pick' ? (
        <WelcomeMatchPill
          name={t(mid.curator.nameKey)}
          matchLabel={t(mid.curator.matchKey)}
          avatar={mid.curator.avatar}
        />
      ) : null}

      {mid.kind === 'list' ? <WelcomeListCard list={mid.list} /> : null}
      {mid.kind === 'pick' ? <WelcomeVibeTags tagKeys={mid.tags} /> : null}
      {mid.kind === 'smartpicks' ? <WelcomeSmartPicksPreview data={mid} /> : null}
    </View>
  );
}
