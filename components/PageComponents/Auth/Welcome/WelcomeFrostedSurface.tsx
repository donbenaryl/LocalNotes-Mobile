import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
type WelcomeFrostedSurfaceProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Border radius in pt. */
  radius?: number;
  intensity?: number;
};

/** Frosted ink glass used by list cards, vibe tags, and SmartPicks preview. */
export function WelcomeFrostedSurface({
  children,
  className = '',
  style,
  radius = 16,
  intensity = 32,
}: WelcomeFrostedSurfaceProps) {
  return (
    <View
      className={`overflow-hidden ${className}`}
      style={[
        {
          borderRadius: radius,
          borderWidth: 1,
          borderColor: 'rgba(243,235,221,0.2)',
          backgroundColor: 'rgba(26,23,20,0.42)',
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />
      <View style={{ borderRadius: radius }}>{children}</View>
    </View>
  );
}
