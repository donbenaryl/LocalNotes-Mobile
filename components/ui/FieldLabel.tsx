import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  hint?: string;
  rightAction?: ReactNode;
  className?: string;
}

export function FieldLabel({ label, required, hint, rightAction, className = "" }: FieldLabelProps) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <View className="flex-row items-center gap-1">
        <Text className={cn("font-geist-medium text-sm text-ink dark:text-gray-100 capitalize", className)}>
          {label}
        </Text>
        {required ? <Text className="text-sm text-error">*</Text> : null}
      </View>
      {rightAction ?? (
        hint ? (
          <Text className="font-geist text-xs text-gray-400 dark:text-gray-500">{hint}</Text>
        ) : null
      )}
    </View>
  );
}
