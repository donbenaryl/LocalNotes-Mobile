import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/utils/cn';

interface BottomWrapperProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function BottomWrapper({ children, className, style }: BottomWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn(
        'border-t border-gray-100 bg-page px-6 py-3 dark:border-dk-line dark:bg-dk-page absolute left-0 right-0',
        className,
      )}
      style={[{ bottom: 0, paddingBottom: insets.bottom + 8 }, style]}
    >
      {children}
    </View>
  );
}
