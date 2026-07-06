import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput } from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
} from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /** Manually scrolls the focused input above the keyboard on all platforms.
   *  Use inside modals where iOS `automaticallyAdjustKeyboardInsets` is unreliable. */
  scrollToFocusedInput?: boolean;
}

export function KeyboardAwareScrollView({
  children,
  onScroll,
  contentContainerStyle,
  scrollToFocusedInput = false,
  ...props
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const KEYBOARD_GAP = 24;
  const useManualScroll = scrollToFocusedInput || Platform.OS === 'android';

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
    onScroll?.(event);
  }

  return (
    <ScrollView
      ref={scrollRef}
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
  );
}
