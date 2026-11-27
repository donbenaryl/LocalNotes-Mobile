import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { WelcomeSlideMidData } from '@/constants/welcomeScreens';
import { WELCOME_CREAM } from '@/constants/welcomeScreens';
import { LNText } from '@/components/ui/LNText';
import { WelcomeListCard } from './WelcomeListCard';
import { WelcomeMatchPill } from './WelcomeMatchPill';
import { WelcomeSmartPicksPreview } from './WelcomeSmartPicksPreview';
import { WelcomeVibeTags } from './WelcomeVibeTags';

type WelcomeSlideMidProps = {
  mid: WelcomeSlideMidData;
  compact?: boolean;
};

export function WelcomeSlideMid({ mid, compact = false }: WelcomeSlideMidProps) {
  const { t } = useTranslation();
  const titleClass = compact
    ? mid.titleSize === 'lg'
      ? 'font-geist-semibold text-[22px] leading-7 tracking-[-0.01em] text-[#F3EBDD]'
      : 'font-geist-semibold text-[18px] leading-6 tracking-[-0.02em] text-[#F3EBDD]'
    : mid.titleSize === 'lg'
      ? 'font-geist-semibold text-[27px] leading-8 tracking-[-0.01em] text-[#F3EBDD]'
      : 'font-geist-semibold text-[22px] leading-7 tracking-[-0.02em] text-[#F3EBDD]';

  const eyebrowMargin = compact
    ? mid.kind === 'smartpicks'
      ? 'mt-3 mb-0.5'
      : 'mt-3 mb-1'
    : mid.kind === 'smartpicks'
      ? 'mt-6 mb-1'
      : 'mt-[26px] mb-1.5';

  return (
    <View className="px-5" pointerEvents="box-none">
      <LNText
        className={`font-geist-semibold text-[11px] uppercase leading-[14px] tracking-[0.12em] text-[rgba(243,235,221,0.82)] ${eyebrowMargin}`}
      >
        {t(mid.eyebrowKey)}
      </LNText>

      <LNText className={titleClass}>{t(mid.titleKey)}</LNText>

      {mid.kind === 'smartpicks' ? (
        <LNText
          className={
            compact
              ? 'mt-0.5 font-geist text-sm leading-5 text-[rgba(243,235,221,0.9)]'
              : 'mt-1 font-geist text-base leading-[22px] text-[rgba(243,235,221,0.9)]'
          }
        >
          {t(mid.subtitleKey)}
        </LNText>
      ) : null}

      {mid.kind === 'pick' ? (
        <View className={`flex-row items-center gap-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
          <MapPin size={compact ? 14 : 16} color={WELCOME_CREAM} strokeWidth={2} />
          <LNText
            className={
              compact
                ? 'font-geist-semibold text-[14px] leading-5 text-[#F3EBDD]'
                : 'font-geist-semibold text-[15px] leading-5 text-[#F3EBDD]'
            }
          >
            {t(mid.placeNameKey)}
          </LNText>
        </View>
      ) : null}

      {mid.kind === 'list' || mid.kind === 'pick' ? (
        <WelcomeMatchPill
          name={t(mid.curator.nameKey)}
          matchLabel={t(mid.curator.matchKey)}
          avatar={mid.curator.avatar}
          compact={compact}
        />
      ) : null}

      {mid.kind === 'list' ? <WelcomeListCard list={mid.list} compact={compact} /> : null}
      {mid.kind === 'pick' ? <WelcomeVibeTags tagKeys={mid.tags} compact={compact} /> : null}
      {mid.kind === 'smartpicks' ? (
        <WelcomeSmartPicksPreview data={mid} compact={compact} />
      ) : null}
    </View>
  );
}
