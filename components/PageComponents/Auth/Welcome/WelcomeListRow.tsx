import { Image, Text, View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import type { WelcomeListRowData } from '@/constants/welcomeScreens';
import { WELCOME_CREAM } from '@/constants/welcomeScreens';
import { useTranslation } from 'react-i18next';

type WelcomeListRowProps = {
  row: WelcomeListRowData;
  isLast?: boolean;
};

function MountainIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M3 19 L10 7 L14 13 L16 10 L21 19 Z"
        fill="none"
        stroke={WELCOME_CREAM}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BridgeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessibilityElementsHidden>
      <G fill="none" stroke={WELCOME_CREAM} strokeWidth={1.8} strokeLinecap="round">
        <Path d="M4 11 H20" />
        <Path d="M4 14.5 H20" />
        <Path d="M6 14.5 V19 M18 14.5 V19" />
        <Path d="M5 7 H19" />
      </G>
    </Svg>
  );
}

export function WelcomeListRow({ row, isLast = false }: WelcomeListRowProps) {
  const { t } = useTranslation();
  const name = t(row.nameKey);
  const place = t(row.placeKey);
  const note = t(row.noteKey);

  return (
    <View
      className="flex-row items-center gap-[11px] py-[7px]"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: 'rgba(243,235,221,0.16)' }
      }
    >
      {row.thumb ? (
        <Image
          source={row.thumb}
          className="h-8 w-8 rounded-[9px]"
          resizeMode="cover"
          accessibilityLabel={name}
        />
      ) : (
        <View
          className="h-8 w-8 items-center justify-center rounded-[9px]"
          style={{ backgroundColor: 'rgba(243,235,221,0.14)' }}
        >
          {row.icon === 'bridge' ? <BridgeIcon /> : <MountainIcon />}
        </View>
      )}
      <View className="min-w-0 flex-1">
        <Text className="font-geist-semibold text-[13px] leading-[17px] text-[#F3EBDD]" numberOfLines={1}>
          {name}
          <Text className="font-geist-medium text-[rgba(243,235,221,0.72)]">{` · ${place}`}</Text>
        </Text>
        <Text className="font-geist text-[12px] leading-4 text-[rgba(243,235,221,0.72)]" numberOfLines={1}>
          {note}
        </Text>
      </View>
    </View>
  );
}
