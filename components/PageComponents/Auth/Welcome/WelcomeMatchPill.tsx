import { Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { WELCOME_CREAM, WELCOME_MATCH_GREEN } from '@/constants/welcomeScreens';

type WelcomeMatchPillProps = {
  name: string;
  matchLabel: string;
  avatar: ImageSourcePropType;
};

export function WelcomeMatchPill({ name, matchLabel, avatar }: WelcomeMatchPillProps) {
  return (
    <View
      className="mt-3 flex-row items-center self-start gap-[9px] rounded-full border py-1 pl-1 pr-3.5"
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
      <Text className="font-geist-medium text-[13px] leading-4 text-[#F3EBDD]">
        <Text className="font-geist-semibold">{name}</Text>
        {' · '}
        <Text className="font-geist-semibold" style={{ color: WELCOME_MATCH_GREEN }}>
          {matchLabel}
        </Text>
      </Text>
    </View>
  );
}
