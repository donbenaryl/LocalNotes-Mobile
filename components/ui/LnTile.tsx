import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';

interface LnTileProps {
  size?: number;
  /** `auto` follows the app theme. */
  variant?: 'auto' | 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

const ICON_LIGHT = require('../../assets/images/logo/ln-icon-light.png');
const ICON_DARK = require('../../assets/images/logo/ln-icon-dark.png');

/** The "Ln" app-icon tile from the redesign logo board. */
export function LnTile({ size = 120, variant = 'auto', style }: LnTileProps) {
  const { colorScheme } = useColorScheme();
  const isDark = variant === 'auto' ? colorScheme === 'dark' : variant === 'dark';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.225,
          backgroundColor: isDark ? '#1A1714' : '#FFFDF8',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,23,20,0.06)',
          shadowColor: isDark ? '#000' : '#1A1714',
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: size * 0.25,
          shadowOffset: { width: 0, height: size * 0.08 },
          elevation: 8,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={isDark ? ICON_DARK : ICON_LIGHT}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}
