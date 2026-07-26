import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BottomWrapper } from '@/components/ui/BottomWrapper';

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
}: ModalProps) {
  const isBottom = position === 'bottom';
  const isFullscreen = position === 'fullscreen';
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (avoidKeyboard || !visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [avoidKeyboard, visible]);

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
    ]).start(() => {
      onDone?.();
    });
  };

  useEffect(() => {
    if (visible) {
      if (!isFullscreen) {
        translateY.setValue(height);
      }
      backdropOpacity.setValue(0);
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
      ]).start();
    }
  }, [visible, height, translateY, backdropOpacity, isFullscreen]);

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

  const sheetMaxHeight =
    !avoidKeyboard && isBottom ? height - keyboardHeight - insets.top : undefined;

  const sheetContent = isBottom ? (
    <Animated.View
      style={{
        transform: [{ translateY }],
        ...(sheetMaxHeight != null ? { maxHeight: sheetMaxHeight } : null),
      }}
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

      <View className="relative">
        {children}
        {footer ? (
          <BottomWrapper className="-mx-8 bg-white dark:bg-gray-900">
            {footer}
          </BottomWrapper>
        ) : null}
      </View>
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
        className="absolute top-0 inset-0"
        pointerEvents="none"
      >
        <View className="absolute top-0 inset-0 bg-ink/50" />
      </Animated.View>
      <Pressable
        className="absolute top-0 inset-0"
        onPress={handleClose}
        style={{ backgroundColor: 'transparent' }}
      />

      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
          pointerEvents="box-none"
        >
          {sheetContent}
        </KeyboardAvoidingView>
      ) : (
        <View
          className="flex-1 justify-end"
          pointerEvents="box-none"
          style={{ paddingBottom: keyboardHeight }}
        >
          {sheetContent}
        </View>
      )}
    </RNModal>
  );
}
