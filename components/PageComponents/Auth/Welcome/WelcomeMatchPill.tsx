import { View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { LNText } from '@/components/ui/LNText';
import { WELCOME_CREAM, WELCOME_MATCH_GREEN } from '@/constants/welcomeScreens';

type WelcomeMatchPillProps = {
  name: string;
  matchLabel: string;
  avatar: ImageSourcePropType;
  compact?: boolean;
};

export function WelcomeMatchPill({
  name,
  matchLabel,
  avatar,
  compact = false,
}: WelcomeMatchPillProps) {
  return (
    <View
      className={`flex-row items-center self-start gap-[9px] rounded-full border py-1 pl-1 pr-3.5 ${
        compact ? 'mt-2' : 'mt-3'
      }`}
      style={{
        backgroundColor: 'rgba(26,23,20,0.5)',
        borderColor: 'rgba(243,235,221,0.22)',
      }}
    >
      <Avatar
        name={name}
        source={avatar}
        size="sm"
        gradientColors={[WELCOME_CREAM, WELCOME_CREAM]}
      />
      <LNText
        className={
          compact
            ? 'font-geist-medium text-[12px] leading-4 text-[#F3EBDD]'
            : 'font-geist-medium text-[13px] leading-4 text-[#F3EBDD]'
        }
      >
        <LNText className="font-geist-semibold">{name}</LNText>
        {' · '}
        <LNText className="font-geist-semibold" style={{ color: WELCOME_MATCH_GREEN }}>
          {matchLabel}
        </LNText>
      </LNText>
    </View>
  );
}
