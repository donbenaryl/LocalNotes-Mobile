import { forwardRef, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
} from 'react-native';
import { KeyboardAwareScrollView as RNKCKeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useScrollToTopControl } from '@/hooks/useScrollToTopControl';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { cn } from '@/utils/cn';

const KEYBOARD_GAP = 24;

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children?: ReactNode;
  /**
   * Kept for API compatibility with previous DIY scroll-into-view.
   * Library scroll-to-focused is always on unless `enabled` is false.
   */
  scrollToFocusedInput?: boolean;
  /** When false, disables keyboard-aware scrolling for this instance. */
  enabled?: boolean;
  bottomOffset?: number;
  extraKeyboardSpace?: number;
  disableScrollOnKeyboardHide?: boolean;
}

export const KeyboardAwareScrollView = forwardRef<
  ScrollView,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  {
    children,
    onScroll,
    contentContainerStyle,
    scrollToFocusedInput: _scrollToFocusedInput = false,
    enabled = true,
    bottomOffset = KEYBOARD_GAP,
    extraKeyboardSpace,
    disableScrollOnKeyboardHide,
    className,
    style,
    keyboardShouldPersistTaps = 'handled',
    showsVerticalScrollIndicator = false,
    ...props
  },
  ref,
) {
  const internalRef = useRef<ScrollView>(null);
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(internalRef);
  // Only fill when the caller opts in — forcing flex-1 collapses content-sized
  // parents (e.g. bottom sheets with max-height only).
  const fillsParent = Boolean(className?.split(/\s+/).includes('flex-1'));

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    onScrollY(event.nativeEvent.contentOffset.y);
    onScroll?.(event);
  }

  function setRefs(node: ScrollView | null) {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }

  return (
    <View className={cn('relative', className)} style={style}>
      <RNKCKeyboardAwareScrollView
        ref={setRefs}
        style={fillsParent ? { flex: 1 } : undefined}
        enabled={enabled}
        bottomOffset={bottomOffset}
        extraKeyboardSpace={extraKeyboardSpace}
        disableScrollOnKeyboardHide={disableScrollOnKeyboardHide}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={contentContainerStyle}
        {...props}
      >
        {children}
      </RNKCKeyboardAwareScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
});
