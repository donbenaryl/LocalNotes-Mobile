import { useEffect } from 'react';
import { Image, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  WELCOME_BACKGROUND,
  WELCOME_GRADIENT_COLORS,
  WELCOME_GRADIENT_LOCATIONS,
} from '@/constants/welcomeScreens';
import { WelcomeFixedChrome } from './WelcomeFixedChrome';

export function WelcomeScreen() {
  const scale = useSharedValue(1.06);

  useEffect(() => {
    // Slow "drift" from the redesign; ReduceMotion.System jumps to the end value.
    scale.value = withTiming(1, {
      duration: 9000,
      easing: Easing.out(Easing.quad),
      reduceMotion: ReduceMotion.System,
    });
  }, [scale]);

  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />

      <Animated.View className="absolute inset-0" style={driftStyle}>
        <Image
          source={WELCOME_BACKGROUND}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
      </Animated.View>

      <LinearGradient
        colors={WELCOME_GRADIENT_COLORS}
        locations={WELCOME_GRADIENT_LOCATIONS}
        className="absolute inset-0"
        pointerEvents="none"
      />

      <WelcomeFixedChrome />
    </View>
  );
}
