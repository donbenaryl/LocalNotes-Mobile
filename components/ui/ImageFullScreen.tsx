import { useEffect } from 'react';
import { Image, useWindowDimensions, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Modal } from '@/components/ui/Modal';

interface ImageFullScreenProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
} as const;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function ImageFullScreen({ uri, visible, onClose }: ImageFullScreenProps) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [
    visible,
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  const getMaxTranslate = (currentScale: number) => {
    'worklet';
    const maxX = Math.max(0, ((currentScale - 1) * width) / 2);
    const maxY = Math.max(0, ((currentScale - 1) * height) / 2);
    return { maxX, maxY };
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE, SPRING_CONFIG);
        savedScale.value = MIN_SCALE;
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }

      savedScale.value = scale.value;
      const { maxX, maxY } = getMaxTranslate(scale.value);
      translateX.value = withSpring(
        clamp(translateX.value, -maxX, maxX),
        SPRING_CONFIG,
      );
      translateY.value = withSpring(
        clamp(translateY.value, -maxY, maxY),
        SPRING_CONFIG,
      );
      savedTranslateX.value = clamp(translateX.value, -maxX, maxX);
      savedTranslateY.value = clamp(translateY.value, -maxY, maxY);
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((event) => {
      if (savedScale.value <= MIN_SCALE && scale.value <= MIN_SCALE) {
        return;
      }

      const currentScale = scale.value;
      const { maxX, maxY } = getMaxTranslate(currentScale);
      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        -maxX,
        maxX,
      );
      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        -maxY,
        maxY,
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const imageStyle = useAnimatedStyle(() => ({
    width,
    height,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal visible={visible} onClose={onClose} position="fullscreen">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          {uri ? (
            <GestureDetector gesture={composedGesture}>
              <AnimatedImage
                source={{ uri }}
                resizeMode="contain"
                style={imageStyle}
                accessibilityIgnoresInvertColors
              />
            </GestureDetector>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
