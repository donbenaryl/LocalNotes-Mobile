import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import {
  ChevronRight,
  Heart,
  MapPin,
  Mountain,
  Shuffle,
  Sparkles,
  User,
  Users,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  WELCOME_CREAM,
  WELCOME_INK,
  WELCOME_MATCH_GREEN,
  type WelcomeSmartPicksSlideData,
} from '@/constants/welcomeScreens';
import { WelcomeFrostedSurface } from './WelcomeFrostedSurface';

type Mode = 'solo' | 'date' | 'group';

type WelcomeSmartPicksPreviewProps = {
  data: WelcomeSmartPicksSlideData;
};

const MODES: { id: Mode; labelKey: string; Icon: typeof User }[] = [
  { id: 'solo', labelKey: 'auth.welcome.slides.smartpicks.solo', Icon: User },
  { id: 'date', labelKey: 'auth.welcome.slides.smartpicks.date', Icon: Heart },
  { id: 'group', labelKey: 'auth.welcome.slides.smartpicks.group', Icon: Users },
];

export function WelcomeSmartPicksPreview({ data }: WelcomeSmartPicksPreviewProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('date');
  const { pick } = data;

  return (
    <View>
      <View className="mt-3 flex-row gap-2" accessibilityRole="tablist">
        {MODES.map(({ id, labelKey, Icon }) => {
          const selected = mode === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setMode(id)}
              className="h-[38px] flex-row items-center gap-1.5 rounded-full px-3.5"
              style={
                selected
                  ? {
                      backgroundColor: WELCOME_CREAM,
                      borderWidth: 1,
                      borderColor: WELCOME_CREAM,
                    }
                  : {
                      backgroundColor: 'rgba(43,34,28,0.55)',
                      borderWidth: 1,
                      borderColor: 'rgba(243,235,221,0.22)',
                    }
              }
            >
              <Icon size={16} color={selected ? WELCOME_INK : WELCOME_CREAM} strokeWidth={1.8} />
              <Text
                className="font-geist-semibold text-[14px]"
                style={{ color: selected ? WELCOME_INK : WELCOME_CREAM }}
              >
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <WelcomeFrostedSurface
        className="mt-3.5"
        radius={18}
        style={{ backgroundColor: 'rgba(43,34,28,0.55)', borderColor: 'rgba(243,235,221,0.22)' }}
      >
        <View className="px-[15px] pb-3 pt-3.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={13} color={WELCOME_CREAM} fill={WELCOME_CREAM} />
              <Text className="font-geist-semibold text-[11px] uppercase leading-[14px] tracking-[0.1em] text-[rgba(243,235,221,0.9)]">
                {t('auth.welcome.slides.smartpicks.yourPick')}
              </Text>
            </View>
            <View
              className="rounded-full px-[9px] py-[3px]"
              style={{ borderWidth: 1, borderColor: 'rgba(93,211,166,0.6)' }}
            >
              <Text
                className="font-geist-semibold text-[12px] leading-4"
                style={{ color: WELCOME_MATCH_GREEN }}
              >
                {t(pick.matchKey)}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center gap-3">
            <Image
              source={pick.image}
              className="h-[92px] w-[92px] rounded-[14px]"
              resizeMode="cover"
              accessibilityLabel={t(pick.nameKey)}
            />
            <View className="min-w-0 flex-1">
              <Text className="font-geist-semibold text-[18px] leading-[23px] text-[#F3EBDD]">
                {t(pick.nameKey)}
              </Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                <MapPin size={13} color={WELCOME_CREAM} strokeWidth={2} />
                <Text className="font-geist text-[13px] leading-[17px] text-[rgba(243,235,221,0.82)]">
                  {t(pick.locationKey)}
                </Text>
              </View>
              <View
                className="mt-1.5 flex-row items-center gap-[5px] self-start rounded-full px-[9px] py-[3px]"
                style={{
                  backgroundColor: 'rgba(243,235,221,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(243,235,221,0.2)',
                }}
              >
                <Mountain size={12} color={WELCOME_CREAM} fill={WELCOME_CREAM} />
                <Text className="font-geist-medium text-[11px] leading-[15px] text-[#F3EBDD]">
                  {t(pick.categoryKey)}
                </Text>
              </View>
              <Text className="mt-1.5 font-geist text-[13px] leading-[18px] text-[rgba(243,235,221,0.9)]">
                {t(pick.blurbKey)}
              </Text>
            </View>
          </View>

          <View
            className="mt-3 flex-row items-center gap-2 pt-2.5"
            style={{ borderTopWidth: 1, borderTopColor: 'rgba(243,235,221,0.16)' }}
          >
            <View className="flex-row items-center pl-[1.5px]">
              {pick.savers.map((saver, index) => (
                <Image
                  key={saver.name}
                  source={saver.avatar}
                  accessibilityLabel={saver.name}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    marginLeft: index === 0 ? 0 : -6,
                    zIndex: pick.savers.length - index,
                    borderWidth: 1.5,
                    borderColor: '#3A2C24',
                  }}
                />
              ))}
            </View>
            <Text className="flex-1 font-geist text-[12px] leading-4 text-[rgba(243,235,221,0.72)]">
              {t(pick.savedByKey)}
            </Text>
          </View>

          <View
            className="mt-2.5 pt-2.5"
            style={{ borderTopWidth: 1, borderTopColor: 'rgba(243,235,221,0.16)' }}
          >
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 self-start"
              onPress={() => undefined}
            >
              <Shuffle size={15} color={WELCOME_CREAM} strokeWidth={2} />
              <Text className="font-geist-semibold text-[13px] leading-[17px] text-[#F3EBDD]">
                {t('auth.welcome.slides.smartpicks.pickAgain')}
              </Text>
              <ChevronRight size={14} color={WELCOME_CREAM} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </WelcomeFrostedSurface>
    </View>
  );
}
