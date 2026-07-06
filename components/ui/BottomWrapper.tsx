import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/utils/cn';

interface BottomWrapperProps {
  children: ReactNode;
  className?: string;
}

export function BottomWrapper({ children, className }: BottomWrapperProps) {
  return (
    <View
      className={cn(
        'border-t border-gray-100 bg-page px-6 py-3 dark:border-gray-800 dark:bg-gray-900 absolute bottom-0 left-0 right-0 pb-6',
        className,
      )}
    >
      {children}
    </View>
  );
}
