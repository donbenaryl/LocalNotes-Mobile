import { Text, View, type TextStyle } from 'react-native';

type LocalNotesTextVariant = 'default' | 'light' | 'brand' | 'brandOnDark';

interface LocalNotesTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: LocalNotesTextVariant;
  withShadow?: boolean;
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
  brand: 'text-brand',
  brandOnDark: 'text-brand',
};

const variantNotesClasses: Record<LocalNotesTextVariant, string> = {
  default: 'text-ink dark:text-gray-100',
  light: 'text-white',
  brand: 'text-white',
  brandOnDark: 'text-white',
};

const textShadowStyle: TextStyle = {
  textShadowColor: 'rgba(0,0,0,0.47)',
  textShadowOffset: { width: 1.3, height: 1.3 },
  textShadowRadius: 2,
};

export function LocalNotesText({
  size = 'md',
  variant = 'default',
  withShadow = false,
}: LocalNotesTextProps) {
  const textClass = `font-madimi ${sizeClasses[size]}`;
  const shadowStyle = withShadow ? textShadowStyle : undefined;

  return (
    <View className="flex-row items-center">
      <Text
        className={`${textClass} ${variantLocalClasses[variant]} pt-1`}
        style={shadowStyle}
      >
        Local
      </Text>
      <Text
        className={`${textClass} ${variantNotesClasses[variant]} pt-1`}
        style={shadowStyle}
      >
        Notes
      </Text>
    </View>
  );
}
