import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';

interface DetailNavRowProps {
  title: string;
  previewLabel?: string;
  previewValue?: string;
  onPress: () => void;
  className?: string;
}

export function DetailNavRow({
  title,
  previewLabel,
  previewValue,
  onPress,
  className,
}: DetailNavRowProps) {
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === 'dark' ? '#6B7280' : '#9CA3AF';

  return (
    <BusinessHomeCard className={className}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="flex-row items-center gap-3 active:opacity-70"
      >
        <View className="min-w-0 flex-1">
          <Text className="font-geist-semibold text-md text-ink dark:text-gray-100">
            {title}
          </Text>
          {previewLabel || previewValue ? (
            <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
              {previewLabel ? (
                <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                  {previewLabel}
                </Text>
              ) : null}
              {previewValue ? (
                <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                  {previewValue}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        <ChevronRight size={18} color={chevronColor} />
      </Pressable>
    </BusinessHomeCard>
  );
}
