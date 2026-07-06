import { Text, View } from 'react-native';

interface LocalNotesTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<NonNullable<LocalNotesTextProps['size']>, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

export function LocalNotesText({ size = 'md' }: LocalNotesTextProps) {
  const textClass = `font-madimi ${sizeClasses[size]}`;

  return (
    <View className="flex-row items-center">
      <Text className={`${textClass} text-brand pt-1`}>Local</Text>
      <Text className={`${textClass} text-ink dark:text-gray-100 pt-1`}>Notes</Text>
    </View>
  );
}
