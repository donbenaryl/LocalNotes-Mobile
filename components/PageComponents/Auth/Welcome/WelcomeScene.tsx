import { Image, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WelcomeScreenConfig } from '@/constants/welcomeScreens';
import {
  WELCOME_BOTTOM_CHROME_HEIGHT,
  WELCOME_LIST_CARD_HEIGHT,
  WELCOME_LOGO_HEIGHT,
  WELCOME_SCENE_BELOW_LOGO_GAP,
  WELCOME_SHORT_SCREEN_HEIGHT,
} from '@/constants/welcomeScreens';

interface WelcomeSceneProps {
  screen: WelcomeScreenConfig;
  showListCard: boolean;
}

function MatchChip({ name, matchPct }: { name: string; matchPct: number }) {
  return (
    <View className="mt-[13px] h-[29px] flex-row items-center self-start overflow-hidden rounded-full border border-white/50 bg-white/25 px-4 pl-2">
      <View className="mr-2 h-2 w-2 rounded-full bg-brand" />
      <Text className="font-geist-bold text-lg text-white">
        {name}
        <Text className="font-geist text-lg text-white">
          {' · '}
          {matchPct}% match to you
        </Text>
      </Text>
    </View>
  );
}

function ListCard({
  title,
  count,
  rows,
  topPt,
}: NonNullable<WelcomeScreenConfig['list']>) {
  return (
    <View
      className="absolute left-[20px] right-[20px] rounded-[13px] border border-white/20 bg-[#0F0C0A]/70 px-[15px] mt-5 py-[11px]"
      style={{ top: topPt, height: WELCOME_LIST_CARD_HEIGHT }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text className="font-geist-bold text-lg text-white" numberOfLines={1}>
        {title}
      </Text>
      <Text className="mt-0.5 font-geist-semibold text-brand">
        {count} picks
      </Text>
      <View className="mt-3 gap-[9px]">
        {rows.map((row) => (
          <View key={row.name} className="flex-row items-center gap-2">
            <Image
              source={row.thumb}
              className="h-[31px] w-[31px] rounded-[7px]"
              resizeMode="cover"
            />
            <View className="min-w-0 flex-1">
              <Text
                className="font-geist-bold text-sm text-white"
                numberOfLines={1}
              >
                {row.name}
              </Text>
              <Text
                className="font-geist text-xs text-[#EBE6E1]"
                numberOfLines={1}
              >
                {row.note}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function WelcomeScene({ screen, showListCard }: WelcomeSceneProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const logoTop = Math.max(insets.top + 4, 37);
  const minCaptionTop =
    logoTop + WELCOME_LOGO_HEIGHT + WELCOME_SCENE_BELOW_LOGO_GAP;
  const captionTop = Math.max(screen.captionTopPt, minCaptionTop);

  const isShort = height < WELCOME_SHORT_SCREEN_HEIGHT;
  const sceneBottomLimit =
    height - insets.bottom - WELCOME_BOTTOM_CHROME_HEIGHT;
  // Caption + chip roughly occupy ~120pt below captionTop before a card can start.
  const minListTop = captionTop + 120;
  const listTop = screen.list
    ? Math.max(screen.list.topPt, minListTop)
    : 0;
  const listFits =
    !!screen.list &&
    listTop + WELCOME_LIST_CARD_HEIGHT <= sceneBottomLimit;

  const list =
    showListCard && !isShort && listFits && screen.list
      ? { ...screen.list, topPt: listTop }
      : null;

  return (
    <View
      className="absolute inset-0"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        className="absolute left-[25px] right-[25px]"
        style={{ top: captionTop }}
      >
        <Text
          className="font-geist-medium text-md uppercase tracking-[2px] text-white/75"
          style={{
            textShadowColor: 'rgba(0,0,0,0.47)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {screen.label}
        </Text>
        <Text
          className="mt-[9px] font-geist-bold text-4xl leading-[34px] text-white"
          style={{
            textShadowColor: 'rgba(0,0,0,0.59)',
            textShadowOffset: { width: 1.3, height: 1.3 },
            textShadowRadius: 4,
          }}
        >
          {screen.caption}
        </Text>
        <MatchChip name={screen.chip.name} matchPct={screen.chip.matchPct} />
      </View>
      {list ? <ListCard {...list} /> : null}
    </View>
  );
}
