import { View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { WelcomeListSlideData } from '@/constants/welcomeScreens';
import { WELCOME_CREAM } from '@/constants/welcomeScreens';
import { LNText } from '@/components/ui/LNText';
import { WelcomeFrostedSurface } from './WelcomeFrostedSurface';
import { WelcomeListRow } from './WelcomeListRow';

type WelcomeListCardProps = {
  list: WelcomeListSlideData['list'];
  compact?: boolean;
};

export function WelcomeListCard({ list, compact = false }: WelcomeListCardProps) {
  const { t } = useTranslation();
  const isNarrow = list.width === 'narrow';

  return (
    <WelcomeFrostedSurface
      className={`self-start ${compact ? 'mt-2.5' : 'mt-3.5'}`}
      style={isNarrow ? { width: 266 } : { alignSelf: 'stretch', width: '100%' }}
      radius={16}
    >
      <View className={compact ? 'px-3.5 pb-1.5 pt-2.5' : 'px-[15px] pb-2 pt-3.5'}>
        <View
          className={`flex-row items-baseline justify-between ${compact ? 'mb-1.5 pb-1.5' : 'mb-2 pb-2'}`}
          style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(243,235,221,0.16)' }}
        >
          <LNText
            className={
              compact
                ? 'font-fraunces italic text-[15px] leading-5 text-[#F3EBDD]'
                : 'font-fraunces italic text-[17px] leading-[22px] text-[#F3EBDD]'
            }
          >
            {t(list.titleKey)}
          </LNText>
          <LNText className="font-geist-semibold text-[11px] leading-[14px] text-[rgba(243,235,221,0.72)]">
            {t(list.picksCountKey)}
          </LNText>
        </View>

        {list.rows.map((row, index) => (
          <WelcomeListRow
            key={row.nameKey}
            row={row}
            isLast={!list.moreKey && index === list.rows.length - 1}
            compact={compact}
          />
        ))}

        {list.moreKey ? (
          <View className={`flex-row items-center gap-1 pb-[3px] ${compact ? 'pt-1.5' : 'pt-[9px]'}`}>
            <LNText className="font-geist-semibold text-[12px] leading-4 text-[#F3EBDD]">
              {t(list.moreKey)}
            </LNText>
            <ChevronDown size={14} color={WELCOME_CREAM} strokeWidth={2} />
          </View>
        ) : null}
      </View>
    </WelcomeFrostedSurface>
  );
}
