import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { WhiteBox } from '@/components/ui/WhiteBox';
import type { ConnectedProviderId } from './types';

interface ProviderVisual {
  label: string;
  letter: string;
  bgClass: string;
  textClass: string;
}

const PROVIDER_VISUALS: Record<ConnectedProviderId, ProviderVisual> = {
  google: {
    label: 'Google',
    letter: 'G',
    bgClass: 'bg-[#4285F4]',
    textClass: 'text-white',
  },
  yelp: {
    label: 'Yelp',
    letter: 'y',
    bgClass: 'bg-[#D32323]',
    textClass: 'text-white',
  },
  amazon: {
    label: 'Amazon',
    letter: 'a',
    bgClass: 'bg-[#FF9900]',
    textClass: 'text-white',
  },
  tripadvisor: {
    label: 'TripAdvisor',
    letter: 'T',
    bgClass: 'bg-[#34E0A1]',
    textClass: 'text-black',
  },
};

interface ConnectedAccountCardProps {
  providerId: ConnectedProviderId;
  connected: boolean;
  subtitle: string;
  onPress: () => void;
  comingSoon?: boolean;
  isLoading?: boolean;
}

export function ConnectedAccountCard({
  providerId,
  connected,
  subtitle,
  onPress,
  comingSoon = false,
  isLoading = false,
}: ConnectedAccountCardProps) {
  const { t } = useTranslation();
  const visual = PROVIDER_VISUALS[providerId];

  const label = comingSoon
    ? t('accountSettings.connectedAccounts.comingSoon')
    : connected
      ? t('accountSettings.connectedAccounts.disconnect')
      : t('accountSettings.connectedAccounts.connect');

  return (
    <WhiteBox className="mb-2 flex-row items-center gap-3 p-3.5">
      <View
        className={`h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg ${visual.bgClass}`}
      >
        <Text className={`font-geist-extrabold text-sm ${visual.textClass}`}>
          {visual.letter}
        </Text>
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-geist-bold text-[13.5px] text-ink dark:text-gray-100">
          {visual.label}
        </Text>
        <Text className="font-geist text-[11.5px] text-gray-500 dark:text-gray-400">
          {subtitle}
        </Text>
      </View>
      <LocalNotesButton
        label={label}
        onPress={onPress}
        variant={connected && !comingSoon ? 'light' : 'dark'}
        size="xs"
        isRounded
        isWidthFull={false}
        disabled={comingSoon || isLoading}
        loading={isLoading}
        className="shrink-0 px-3.5"
      />
    </WhiteBox>
  );
}
