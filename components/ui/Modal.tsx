import {
  Animated,
  Easing,
  Modal as RNModal,
  PanResponder,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  KeyboardAvoidingView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BottomWrapper } from '@/components/ui/BottomWrapper';

/** Drives the enter/exit choreography of `topContent`: 0 = closed, 1 = fully open. */
const TOP_CONTENT_ENTER = { duration: 420, easing: Easing.out(Easing.cubic) };
const TOP_CONTENT_EXIT = { duration: 240, easing: Easing.in(Easing.cubic) };

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: 'bottom' | 'center' | 'fullscreen';
  footer?: ReactNode;
  withCloseIcon?: boolean;
  /** When false, skip KeyboardAvoidingView and lift via keyboard-height padding + maxHeight clamp. */
  avoidKeyboard?: boolean;
  /** Content shown above the sheet. As a function, it receives the 0→1 open progress. */
  topContent?: ReactNode | ((progress: Animated.Value) => ReactNode);
  sheetHeightRatio?: number;
  backdropOpacityValue?: number;
  backdropColor?: string;
}

export function Modal({
  visible,
  onClose,
  children,
  title,
  position = 'bottom',
  footer,
  withCloseIcon = false,
  avoidKeyboard = true,
  topContent,
  sheetHeightRatio,
  backdropOpacityValue = 0.5,
  backdropColor = '#1C1917',
}: ModalProps) {
  const isBottom = position === 'bottom';
  const isFullscreen = position === 'fullscreen';
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const topProgress = useRef(new Animated.Value(0)).current;
  const wasVisibleRef = useRef(false);

  // Library `height` is 0 when closed and negative when the keyboard is open.
  const { height: keyboardHeightSV } = useReanimatedKeyboardAnimation();
  const keyboardLiftEnabled = useSharedValue(0);

  useEffect(() => {
    keyboardLiftEnabled.value = !avoidKeyboard && visible && isBottom ? 1 : 0;
  }, [avoidKeyboard, visible, isBottom, keyboardLiftEnabled]);

  const fadeOut = (onDone?: () => void) => {
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onDone?.();
    });
  };

  const slideDown = (onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(topProgress, {
        toValue: 0,
        ...TOP_CONTENT_EXIT,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDone?.();
    });
  };

  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = visible;

    if (visible && !wasVisible) {
      translateY.stopAnimation();
      backdropOpacity.stopAnimation();
      topProgress.stopAnimation();

      if (!isFullscreen) {
        translateY.setValue(height);
      }
      backdropOpacity.setValue(0);
      topProgress.setValue(0);
      Animated.parallel([
        ...(isFullscreen
          ? []
          : [
              Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 0,
                speed: 20,
              }),
            ]),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(topProgress, {
          toValue: 1,
          ...TOP_CONTENT_ENTER,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!visible && wasVisible) {
      translateY.stopAnimation();
      backdropOpacity.stopAnimation();
      topProgress.stopAnimation();
      if (!isFullscreen) {
        translateY.setValue(height);
      }
      backdropOpacity.setValue(0);
      topProgress.setValue(0);
    }
  }, [visible, height, translateY, backdropOpacity, topProgress, isFullscreen]);

  const handleClose = () => {
    if (isFullscreen) {
      fadeOut(onClose);
      return;
    }
    slideDown(onClose);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: height,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(topProgress, {
              toValue: 0,
              ...TOP_CONTENT_EXIT,
              useNativeDriver: true,
            }),
          ]).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 20,
          }).start();
        }
      },
    })
  ).current;

  const configuredSheetMaxHeight =
    isBottom && sheetHeightRatio != null ? height * sheetHeightRatio : undefined;
  const hasFixedSheetHeight = configuredSheetMaxHeight != null;
  const useAnimatedKeyboardLift = !avoidKeyboard && isBottom;
  const windowSheetMaxHeight = height - insets.top;

  const keyboardPadStyle = useAnimatedStyle(() => {
    if (keyboardLiftEnabled.value !== 1) {
      return { paddingBottom: 0 };
    }
    return { paddingBottom: -keyboardHeightSV.value };
  });

  const sheetSizeStyle = useAnimatedStyle(() => {
    if (keyboardLiftEnabled.value !== 1) {
      if (configuredSheetMaxHeight != null) {
        return hasFixedSheetHeight
          ? {
              height: configuredSheetMaxHeight,
              maxHeight: configuredSheetMaxHeight,
              overflow: 'hidden' as const,
            }
          : { maxHeight: configuredSheetMaxHeight };
      }
      return {};
    }

    const keyboardMax = windowSheetMaxHeight + keyboardHeightSV.value;
    const maxH =
      configuredSheetMaxHeight != null
        ? Math.min(configuredSheetMaxHeight, keyboardMax)
        : keyboardMax;

    return hasFixedSheetHeight
      ? { height: maxH, maxHeight: maxH, overflow: 'hidden' as const }
      : { maxHeight: maxH, overflow: 'hidden' as const };
  });

  const topPreviewStyle = useAnimatedStyle(() => {
    if (keyboardLiftEnabled.value !== 1) {
      const sheetH = configuredSheetMaxHeight ?? windowSheetMaxHeight;
      return { top: 0, bottom: sheetH };
    }

    const padding = -keyboardHeightSV.value;
    const keyboardMax = windowSheetMaxHeight + keyboardHeightSV.value;
    const sheetH =
      configuredSheetMaxHeight != null
        ? Math.min(configuredSheetMaxHeight, keyboardMax)
        : keyboardMax;

    return { top: 0, bottom: sheetH + padding };
  });

  if (isFullscreen) {
    return (
      <RNModal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={handleClose}
      >
        <Animated.View
          style={[{ opacity: backdropOpacity }]}
          className="flex-1 bg-ink"
        >
          <View className="flex-1">{children}</View>

          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            className="absolute z-10 h-10 w-10 items-center justify-center rounded-full bg-white/15 cursor-pointer"
            style={{ top: insets.top + 8, right: 16 }}
            hitSlop={8}
          >
            <Text className="text-base leading-none text-white">✕</Text>
          </Pressable>
        </Animated.View>
      </RNModal>
    );
  }

  const sheetContent = isBottom ? (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Reanimated.View
        style={sheetSizeStyle}
        className={`bg-white dark:bg-gray-900 rounded-t-[35px] px-8 ${footer ? 'pb-0' : 'pb-10'}`}
      >
        <View
          className="w-full items-center pt-3 pb-3"
          {...panResponder.panHandlers}
        >
          <View className="absolute w-24 h-[5px] rounded-full bg-gray-300 dark:bg-gray-600 mt-2" />
        </View>

        {title ? (
          <View className="flex-row items-center justify-between mb-4 pt-2">
            <Text className="font-geist-bold text-xl text-gray-900 dark:text-gray-100 flex-1 pr-4">
              {title}
            </Text>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center cursor-pointer"
              hitSlop={8}
            >
              <Text className="text-gray-600 dark:text-gray-300 text-base leading-none">✕</Text>
            </Pressable>
          </View>
        ) : withCloseIcon ? (
          <View className="mb-4 -mt-2 -mr-2 items-end pt-2">
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center cursor-pointer"
              hitSlop={8}
            >
              <Text className="text-gray-600 dark:text-gray-300 text-base leading-none">✕</Text>
            </Pressable>
          </View>
        ) : null}

        <View className={hasFixedSheetHeight ? 'relative min-h-0 flex-1' : 'relative'}>
          {children}
          {footer ? (
            <BottomWrapper className="-mx-8 bg-white dark:bg-gray-900">
              {footer}
            </BottomWrapper>
          ) : null}
        </View>
      </Reanimated.View>
    </Animated.View>
  ) : (
    <View
      className="absolute self-center bg-white dark:bg-gray-900 rounded-2xl px-6 py-8 w-11/12"
      style={{ top: '30%' }}
    >
      {title ? (
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-geist-bold text-xl text-gray-900 dark:text-gray-100 flex-1 pr-4">
            {title}
          </Text>
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center cursor-pointer"
            hitSlop={8}
          >
            <Text className="text-gray-600 dark:text-gray-300 text-base leading-none">✕</Text>
          </Pressable>
        </View>
      ) : withCloseIcon ? (
        <View className="mb-4 items-end">
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center cursor-pointer"
            hitSlop={8}
          >
            <Text className="text-gray-600 dark:text-gray-300 text-base leading-none">✕</Text>
          </Pressable>
        </View>
      ) : null}
      {children}
    </View>
  );

  const topPreview =
    topContent && isBottom && (useAnimatedKeyboardLift || configuredSheetMaxHeight != null) ? (
      <Reanimated.View
        pointerEvents="none"
        className="absolute left-0 right-0 z-20"
        style={topPreviewStyle}
      >
        {typeof topContent === 'function' ? topContent(topProgress) : topContent}
      </Reanimated.View>
    ) : null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[{ opacity: backdropOpacity }]}
        className="absolute top-0 inset-0 z-0"
        pointerEvents="none"
      >
        <View
          className="absolute top-0 inset-0"
          style={{ backgroundColor: backdropColor, opacity: backdropOpacityValue }}
        />
      </Animated.View>
      <Pressable
        className="absolute top-0 inset-0 z-10"
        onPress={handleClose}
        style={{ backgroundColor: 'transparent' }}
      />

      {topPreview}

      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={{ zIndex: 30, flex: 1, justifyContent: 'flex-end' }}
          pointerEvents="box-none"
        >
          {sheetContent}
        </KeyboardAvoidingView>
      ) : (
        <Reanimated.View
          className="z-30 flex-1 justify-end"
          pointerEvents="box-none"
          style={keyboardPadStyle}
        >
          {sheetContent}
        </Reanimated.View>
      )}
    </RNModal>
  );
}
