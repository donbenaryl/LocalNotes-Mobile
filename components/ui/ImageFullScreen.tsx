import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useVideoPlayer, VideoView } from 'expo-video';
import { Modal } from '@/components/ui/Modal';
import { usePlayableVideoUri } from '@/hooks/usePlayableVideoUri';

export interface MediaItem {
  type: 'image' | 'video';
  uri: string;
}

interface ImageFullScreenProps {
  /** Single image URI. Prefer `uris` when showing a gallery. Ignored when `media` is provided. */
  uri?: string;
  /** Gallery of image URIs. When provided, swipe left/right to navigate. Ignored when `media` is provided. */
  uris?: string[];
  /** Mixed image/video items. Takes precedence over `uri`/`uris` when provided. */
  media?: MediaItem[];
  /** Index to open when there are multiple items. */
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

interface VideoPageProps {
  uri: string;
  width: number;
  height: number;
  isActive: boolean;
}

interface PlayableVideoViewProps {
  uri: string;
  width: number;
  height: number;
  isActive: boolean;
}

/** Mounted only with a playable URI so useVideoPlayer is never fed a Range-broken http source. */
function PlayableVideoView({
  uri,
  width,
  height,
  isActive,
}: PlayableVideoViewProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      style={{ width, height }}
      contentFit="contain"
      nativeControls
      allowsFullscreen
      allowsPictureInPicture={false}
      // Overlapping views (page counter, gesture layer) can lose correct
      // z-order/touch behavior with the default surfaceView on Android.
      surfaceType="textureView"
    />
  );
}

function VideoPage({ uri, width, height, isActive }: VideoPageProps) {
  const { playableUri, isPreparing } = usePlayableVideoUri(uri);

  return (
    <View style={{ width, height }} className="items-center justify-center bg-black">
      {playableUri ? (
        <PlayableVideoView
          uri={playableUri}
          width={width}
          height={height}
          isActive={isActive}
        />
      ) : isPreparing ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : null}
    </View>
  );
}

export function ImageFullScreen({
  uri,
  uris,
  media,
  initialIndex = 0,
  visible,
  onClose,
}: ImageFullScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<MediaItem>>(null);

  const items = useMemo<MediaItem[]>(() => {
    if (media && media.length > 0) return media.filter((item) => Boolean(item.uri));
    if (uris && uris.length > 0) {
      return uris.filter(Boolean).map((u) => ({ type: 'image' as const, uri: u }));
    }
    if (uri) return [{ type: 'image' as const, uri }];
    return [];
  }, [uri, uris, media]);

  const clampedInitialIndex = Math.max(
    0,
    Math.min(initialIndex, Math.max(items.length - 1, 0)),
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
      setCurrentIndex(Math.max(0, Math.min(next, items.length - 1)));
      setIsZoomed(false);
    },
    [items.length, width],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<MediaItem>) =>
      item.type === 'video' ? (
        <VideoPage
          uri={item.uri}
          width={width}
          height={height}
          isActive={visible && index === currentIndex}
        />
      ) : (
        <ZoomableImagePage
          uri={item.uri}
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
    (item: MediaItem, index: number) => `${item.uri}-${index}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<MediaItem> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const showCounter = items.length > 1;
  const canSwipe = !isZoomed && items.length > 1;

  return (
    <Modal visible={visible} onClose={onClose} position="fullscreen">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center">
          {items.length > 0 ? (
            <FlatList
              ref={listRef}
              data={items}
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
                  total: items.length,
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
