import { Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { WelcomeListSlideData } from '@/constants/welcomeScreens';
import { WELCOME_CREAM } from '@/constants/welcomeScreens';
import { WelcomeFrostedSurface } from './WelcomeFrostedSurface';
import { WelcomeListRow } from './WelcomeListRow';

type WelcomeListCardProps = {
  list: WelcomeListSlideData['list'];
};

export function WelcomeListCard({ list }: WelcomeListCardProps) {
  const { t } = useTranslation();
  const isNarrow = list.width === 'narrow';

  return (
    <WelcomeFrostedSurface
      className="mt-3.5 self-start"
      style={isNarrow ? { width: 266 } : { alignSelf: 'stretch', width: '100%' }}
      radius={16}
    >
      <View className="px-[15px] pb-2 pt-3.5">
        <View
          className="mb-2 flex-row items-baseline justify-between pb-2"
          style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(243,235,221,0.16)' }}
        >
          <Text className="font-fraunces italic text-[17px] leading-[22px] text-[#F3EBDD]">
            {t(list.titleKey)}
          </Text>
          <Text className="font-geist-semibold text-[11px] leading-[14px] text-[rgba(243,235,221,0.72)]">
            {t(list.picksCountKey)}
          </Text>
        </View>

        {list.rows.map((row, index) => (
          <WelcomeListRow
            key={row.nameKey}
            row={row}
            isLast={!list.moreKey && index === list.rows.length - 1}
          />
        ))}

        {list.moreKey ? (
          <View className="flex-row items-center gap-1 pb-[3px] pt-[9px]">
            <Text className="font-geist-semibold text-[12px] leading-4 text-[#F3EBDD]">
              {t(list.moreKey)}
            </Text>
            <ChevronDown size={14} color={WELCOME_CREAM} strokeWidth={2} />
          </View>
        ) : null}
      </View>
    </WelcomeFrostedSurface>
  );
}
