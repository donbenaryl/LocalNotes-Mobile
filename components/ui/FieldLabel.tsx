import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  hint?: string;
  rightAction?: ReactNode;
}

export function FieldLabel({ label, required, hint, rightAction }: FieldLabelProps) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <View className="flex-row items-center gap-1">
        <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
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
