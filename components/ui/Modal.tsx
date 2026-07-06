import {
  Animated,
  KeyboardAvoidingView,
  Modal as RNModal,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { BottomWrapper } from '@/components/ui/BottomWrapper';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: 'bottom' | 'center';
  footer?: ReactNode;
}

export function Modal({
  visible,
  onClose,
  children,
  title,
  position = 'bottom',
  footer,
}: ModalProps) {
  const isBottom = position === 'bottom';
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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
      translateY.setValue(height);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, height, translateY, backdropOpacity]);

  const handleClose = () => {
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
        pointerEvents="box-none"
      >
        {isBottom ? (
          <Animated.View
            style={{ transform: [{ translateY }] }}
            className={`bg-white dark:bg-gray-900 rounded-t-[35px] px-8 ${footer ? 'pb-0' : 'pb-10'}`}
          >
            <View
              className="w-full items-center pt-3 pb-3"
              {...panResponder.panHandlers}
            >
              <View className="absolute w-24 h-[5px] rounded-full bg-gray-300 dark:bg-gray-600" />
            </View>

            {title ? (
              <View className="flex-row items-center justify-between mb-4 pt-2">
                <Text className="font-geist-bold text-xl text-gray-900 dark:text-gray-100 flex-1 pr-4">
                  {title}
                </Text>
                <Pressable
                  onPress={handleClose}
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
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center cursor-pointer"
                  hitSlop={8}
                >
                  <Text className="text-gray-600 dark:text-gray-300 text-base leading-none">✕</Text>
                </Pressable>
              </View>
            ) : null}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </RNModal>
  );
}
