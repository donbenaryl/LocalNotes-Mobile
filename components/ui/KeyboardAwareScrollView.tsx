import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, View } from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
} from 'react-native';
import { useScrollToTopControl } from '@/hooks/useScrollToTopControl';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { cn } from '@/utils/cn';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children?: ReactNode;
  /** Manually scrolls the focused input above the keyboard on all platforms.
   *  Use inside modals where iOS `automaticallyAdjustKeyboardInsets` is unreliable. */
  scrollToFocusedInput?: boolean;
}

export function KeyboardAwareScrollView({
  children,
  onScroll,
  contentContainerStyle,
  scrollToFocusedInput = false,
  className,
  style,
  ...props
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const KEYBOARD_GAP = 24;
  const useManualScroll = scrollToFocusedInput || Platform.OS === 'android';
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);
  // Only fill when the caller opts in — forcing flex-1 collapses content-sized
  // parents (e.g. bottom sheets with max-height only).
  const fillsParent = Boolean(className?.split(/\s+/).includes('flex-1'));

  useEffect(() => {
    if (!useManualScroll) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      const keyboardTop = event.endCoordinates.screenY;

      const focusedInput = TextInput.State.currentlyFocusedInput();
      if (!focusedInput) return;

      setTimeout(() => {
        focusedInput.measureInWindow((_x, y, _width, height) => {
          const overlap = y + height - keyboardTop;
          if (overlap > 0) {
            scrollRef.current?.scrollTo({
              y: scrollOffsetY.current + overlap + KEYBOARD_GAP,
              animated: true,
            });
          }
        });
      }, Platform.OS === 'ios' ? 0 : 50);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [useManualScroll]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetY.current = event.nativeEvent.contentOffset.y;
    onScrollY(event.nativeEvent.contentOffset.y);
    onScroll?.(event);
  }

  return (
    <View className={cn('relative', className)} style={style}>
      <ScrollView
        ref={scrollRef}
        className={fillsParent ? 'flex-1' : undefined}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && !scrollToFocusedInput}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={[
          contentContainerStyle,
          keyboardHeight > 0 ? { paddingBottom: keyboardHeight + KEYBOARD_GAP } : null,
        ]}
        {...props}
      >
        {children}
      </ScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
