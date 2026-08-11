import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { cn } from '@/utils/cn';

interface BottomWrapperProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function BottomWrapper({ children, className, style }: BottomWrapperProps) {
  return (
    <View
      className={cn(
        'border-t border-gray-100 bg-page px-6 py-3 dark:border-gray-800 dark:bg-gray-900 absolute left-0 right-0 pb-6',
        className,
      )}
      style={[{ bottom: 0 }, style]}
    >
      {children}
    </View>
  );
}
