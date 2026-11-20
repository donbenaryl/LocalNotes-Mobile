import { Text, View } from 'react-native';

type LocalNotesTextVariant = 'default' | 'light' | 'brandOnDark';

interface LocalNotesTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: LocalNotesTextVariant;
}

const sizeClasses: Record<NonNullable<LocalNotesTextProps['size']>, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

const variantLocalClasses: Record<LocalNotesTextVariant, string> = {
  default: 'text-brand',
  light: 'text-white',
  brandOnDark: 'text-brand',
};

const variantNotesClasses: Record<LocalNotesTextVariant, string> = {
  default: 'text-ink dark:text-gray-100',
  light: 'text-white',
  brandOnDark: 'text-white',
};

export function LocalNotesText({ size = 'md', variant = 'default' }: LocalNotesTextProps) {
  const textClass = `font-madimi ${sizeClasses[size]}`;

  return (
    <View className="flex-row items-center">
      <Text className={`${textClass} ${variantLocalClasses[variant]} pt-1`}>Local</Text>
      <Text className={`${textClass} ${variantNotesClasses[variant]} pt-1`}>Notes</Text>
    </View>
  );
}
