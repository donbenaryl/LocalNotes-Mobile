import { Text, View, type TextStyle } from 'react-native';

type LocalNotesTextVariant = 'default' | 'light' | 'brand' | 'brandOnDark' | 'cream';

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
  default: 'text-ink dark:text-dk-text',
  light: 'text-white',
  brand: 'text-ink dark:text-dk-text',
  // Always light — used on dark splash / force-update surfaces.
  brandOnDark: 'text-gray-100',
  // Redesign cream (#F7F3EC) — used on the welcome photo.
  cream: 'text-page',
};

const variantNotesClasses: Record<LocalNotesTextVariant, string> = {
  default: 'text-ink dark:text-dk-text',
  light: 'text-white',
  brand: 'text-white',
  brandOnDark: 'text-white',
  cream: 'text-page',
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
