import { Text, type TextProps } from 'react-native';

/** Shared Dynamic Type cap for layout-critical copy. Do not override per call site. */
const LN_MAX_FONT_SIZE_MULTIPLIER = 1.15;

export function LNText(props: TextProps) {
  return <Text {...props} maxFontSizeMultiplier={LN_MAX_FONT_SIZE_MULTIPLIER} />;
}
