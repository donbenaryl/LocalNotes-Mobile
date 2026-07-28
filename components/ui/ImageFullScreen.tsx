import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type ViewToken,
} from 'react-native';
import {
  FlatList,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';

interface ImageFullScreenProps {
  /** Single image URI. Prefer `uris` when showing a gallery. */
  uri?: string;
  /** Gallery of image URIs. When provided, swipe left/right to navigate. */
  uris?: string[];
  /** Index to open when `uris` has multiple images. */
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_EPSILON = 0.01;
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

interface ZoomableImagePageProps {
  uri: string;
  width: number;
  height: number;
  isActive: boolean;
  onZoomChange: (isZoomed: boolean) => void;
}

function ZoomableImagePage({
  uri,
  width,
  height,
  isActive,
  onZoomChange,
}: ZoomableImagePageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // Keep pan disabled at 1x so the gallery FlatList can own horizontal swipes.
  const [isPanEnabled, setIsPanEnabled] = useState(false);

  const resetTransform = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  useEffect(() => {
    if (!isActive) {
      resetTransform();
      setIsPanEnabled(false);
      onZoomChange(false);
    }
  }, [isActive, onZoomChange, resetTransform]);

  const getMaxTranslate = (currentScale: number) => {
    'worklet';
    const maxX = Math.max(0, ((currentScale - 1) * width) / 2);
    const maxY = Math.max(0, ((currentScale - 1) * height) / 2);
    return { maxX, maxY };
  };

  const setZoomed = (isZoomed: boolean) => {
    setIsPanEnabled(isZoomed);
    onZoomChange(isZoomed);
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      // Lock gallery paging for the duration of the pinch.
      runOnJS(setZoomed)(true);
    })
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE + ZOOM_EPSILON) {
        scale.value = withSpring(MIN_SCALE, SPRING_CONFIG);
        savedScale.value = MIN_SCALE;
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(setZoomed)(false);
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
      runOnJS(setZoomed)(true);
    })
    .onFinalize((_, success) => {
      if (
        !success &&
        scale.value <= MIN_SCALE + ZOOM_EPSILON &&
        savedScale.value <= MIN_SCALE + ZOOM_EPSILON
      ) {
        runOnJS(setZoomed)(false);
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(isPanEnabled)
    .averageTouches(true)
    .onUpdate((event) => {
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

  // Pinch always active; pan only when zoomed so 1-finger swipes reach FlatList.
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
    <View style={{ width, height }} className="items-center justify-center">
      <GestureDetector gesture={composedGesture}>
        <Animated.View collapsable={false} style={{ width, height }}>
          <AnimatedImage
            source={{ uri }}
            resizeMode="contain"
            style={imageStyle}
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export function ImageFullScreen({
  uri,
  uris,
  initialIndex = 0,
  visible,
  onClose,
}: ImageFullScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);

  const images = useMemo(() => {
    if (uris && uris.length > 0) return uris.filter(Boolean);
    if (uri) return [uri];
    return [];
  }, [uri, uris]);

  const clampedInitialIndex = Math.max(
    0,
    Math.min(initialIndex, Math.max(images.length - 1, 0)),
  );

  const [currentIndex, setCurrentIndex] = useState(clampedInitialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsZoomed(false);
      return;
    }

    setCurrentIndex(clampedInitialIndex);
    setIsZoomed(false);

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: clampedInitialIndex,
        animated: false,
      });
    });
  }, [visible, clampedInitialIndex]);

  const handleZoomChange = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setCurrentIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setCurrentIndex(Math.max(0, Math.min(next, images.length - 1)));
      setIsZoomed(false);
    },
    [images.length, width],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<string>) => (
      <ZoomableImagePage
        uri={item}
        width={width}
        height={height}
        isActive={visible && index === currentIndex}
        onZoomChange={
          index === currentIndex ? handleZoomChange : () => undefined
        }
      />
    ),
    [width, height, visible, currentIndex, handleZoomChange],
  );

  const keyExtractor = useCallback(
    (item: string, index: number) => `${item}-${index}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const showCounter = images.length > 1;
  const canSwipe = !isZoomed && images.length > 1;

  return (
    <Modal visible={visible} onClose={onClose} position="fullscreen">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          {images.length > 0 ? (
            <FlatList
              ref={listRef}
              data={images}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              horizontal
              pagingEnabled
              bounces={false}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={canSwipe}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              getItemLayout={getItemLayout}
              initialScrollIndex={clampedInitialIndex}
              windowSize={3}
              removeClippedSubviews={false}
            />
          ) : null}

          {showCounter ? (
            <View
              className="absolute self-center rounded-full bg-black/60 px-3 py-1.5"
              style={{ top: insets.top + 12 }}
              pointerEvents="none"
            >
              <Text className="font-geist-bold text-[12px] text-white">
                {t('profile.picks.photoCount', {
                  current: currentIndex + 1,
                  total: images.length,
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
