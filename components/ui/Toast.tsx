import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  useToastStore,
  type ShowToastInput,
  type ToastData,
  type ToastType,
} from '../../stores/useToastStore';

interface ToastOptions {
  title?: string;
  duration?: number;
}

interface VariantStyle {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

const variantStyles: Record<ToastType, VariantStyle> = {
  success: {
    icon: CheckCircle2,
    iconColor: '#15803D',
    iconBg: 'bg-success-tint dark:bg-success/20',
  },
  error: {
    icon: XCircle,
    iconColor: '#EF4444',
    iconBg: 'bg-error/10 dark:bg-error/20',
  },
  info: {
    icon: Info,
    iconColor: '#2B8FD9',
    iconBg: 'bg-verified/10 dark:bg-verified/20',
  },
  warn: {
    icon: AlertTriangle,
    iconColor: '#BA7517',
    iconBg: 'bg-curator/10 dark:bg-curator/20',
  },
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);
  const reduceMotion = useRef(false);

  const variant = variantStyles[toast.type];
  const Icon = variant.icon;
  const accessibilityLabel = toast.title
    ? `${toast.title}. ${toast.message}`
    : toast.message;

  const runExit = useCallback(
    (onComplete?: () => void) => {
      if (isDismissing.current) return;
      isDismissing.current = true;

      if (reduceMotion.current) {
        onComplete?.();
        return;
      }

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -24,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onComplete?.());
    },
    [opacity, translateY],
  );

  const handleDismiss = useCallback(() => {
    runExit(() => onDismiss(toast.id));
  }, [onDismiss, runExit, toast.id]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      if (!mounted) return;

      reduceMotion.current = isReduced;

      if (isReduced) {
        translateY.setValue(0);
        opacity.setValue(1);
      } else {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
            speed: 18,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      }

      AccessibilityInfo.announceForAccessibility(accessibilityLabel);
    }

    init();

    const timer = setTimeout(handleDismiss, toast.duration);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [
    accessibilityLabel,
    handleDismiss,
    opacity,
    toast.duration,
    translateY,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 6 || Math.abs(gesture.dx) > 6,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy < 0) panY.setValue(gesture.dy);
          panX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldDismiss =
            gesture.dy < -40 ||
            gesture.vy < -0.5 ||
            Math.abs(gesture.dx) > 80 ||
            Math.abs(gesture.vx) > 0.5;

          if (shouldDismiss) {
            handleDismiss();
            return;
          }

          Animated.parallel([
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
              speed: 20,
            }),
            Animated.spring(panX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
              speed: 20,
            }),
          ]).start();
        },
      }),
    [handleDismiss, panX, panY],
  );

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY: Animated.add(translateY, panY) },
          { translateX: panX },
        ],
      }}
      className="mb-2"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
      {...panResponder.panHandlers}
    >
      <View className="flex-row items-start gap-3 rounded-2xl border border-gray-100 bg-paper px-4 py-3.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <View
          className={`mt-0.5 h-9 w-9 items-center justify-center rounded-full ${variant.iconBg}`}
        >
          <Icon size={18} color={variant.iconColor} strokeWidth={2.25} />
        </View>

        <View className="min-w-0 flex-1 pr-1">
          {toast.title ? (
            <Text className="font-geist-semibold text-[15px] leading-5 text-ink dark:text-gray-100">
              {toast.title}
            </Text>
          ) : null}
          <Text
            className={`font-geist text-sm leading-5 text-gray-500 dark:text-gray-400 ${
              toast.title ? 'mt-0.5' : ''
            }`}
          >
            {toast.message}
          </Text>
        </View>

        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          className="cursor-pointer"
        >
          <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <X size={14} color="#6B7280" strokeWidth={2.5} />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function ToastViewport() {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 px-4"
      style={{ top: insets.top + 8 }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </View>
  );
}

function showToast(type: ToastType, message: string, options?: ToastOptions) {
  return useToastStore.getState().show({
    type,
    message,
    title: options?.title,
    duration: options?.duration,
  });
}

export const toast = {
  show: (input: ShowToastInput) => useToastStore.getState().show(input),
  success: (message: string, options?: ToastOptions) =>
    showToast('success', message, options),
  error: (message: string, options?: ToastOptions) =>
    showToast('error', message, options),
  info: (message: string, options?: ToastOptions) =>
    showToast('info', message, options),
  warn: (message: string, options?: ToastOptions) =>
    showToast('warn', message, options),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};

export function useToast() {
  return toast;
}
