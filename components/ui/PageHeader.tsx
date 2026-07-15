import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ChevronLeft } from 'lucide-react-native';

interface PageHeaderProps {
  title?: string;
  onBack?: () => void;
  hideBack?: boolean;
  children?: ReactNode;
  leftChild?: ReactNode;
  rightChild?: ReactNode;
  borderless?: boolean;
}

export function PageHeader({
  title,
  onBack,
  hideBack = false,
  children,
  leftChild,
  rightChild,
  borderless = false,
}: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const backControl =
    leftChild ??
    (hideBack ? (
      null
    ) : (
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 cursor-pointer"
      >
        <ChevronLeft
          size={19}
          color={colorScheme === 'dark' ? '#F3F4F6' : '#141413'}
        />
      </TouchableOpacity>
    ));

  return (
    <View
      style={{ paddingTop: insets.top }}
      className={`px-6 pb-4${borderless ? '' : ' border-b border-gray-100 dark:border-gray-800'}`}
    >
      <View className="min-h-10 justify-center">
        {children ? (
          <View className="w-full flex-row items-center gap-2">
            <View className="shrink-0">{backControl}</View>
            <View className="min-w-0 flex-1">{children}</View>
            {rightChild ? (
              <View className="shrink-0">{rightChild}</View>
            ) : null}
          </View>
        ) : (
          <View className="w-full flex-row items-center justify-center">
            <View className="absolute left-0 z-10">{backControl}</View>
            <Text
              pointerEvents="none"
              className="font-geist-bold text-lg text-ink dark:text-gray-100"
            >
              {title}
            </Text>
            {rightChild ? (
              <View className="absolute right-0 z-10">{rightChild}</View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}
