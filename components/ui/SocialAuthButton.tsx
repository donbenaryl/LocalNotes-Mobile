import { Text, TouchableOpacity } from 'react-native';
import { GoogleLogoIcon } from './icons/GoogleLogoIcon';
import { AppleLogoIcon } from './icons/AppleLogoIcon';

type Provider = 'google' | 'apple';

interface SocialAuthButtonProps {
  provider: Provider;
  onPress: () => void;
  disabled?: boolean;
}

const PROVIDERS: Record<Provider, { label: string; logo: () => React.JSX.Element }> = {
  google: { label: 'Google', logo: GoogleLogoIcon },
  apple: { label: 'Apple', logo: AppleLogoIcon },
};

export function SocialAuthButton({ provider, onPress, disabled }: SocialAuthButtonProps) {
  const { label, logo: Logo } = PROVIDERS[provider];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      className="flex-1 flex-row items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl h-14 w-full bg-white dark:bg-gray-800 gap-3 cursor-pointer"
    >
      <Logo />
      <Text className="text-ink dark:text-gray-100 font-geist-medium text-base">{label}</Text>
    </TouchableOpacity>
  );
}
