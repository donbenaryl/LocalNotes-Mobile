import { Pressable, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { ReactNode } from 'react';

interface UserTypeCardProps {
  selected: boolean;
  onPress: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}

export function UserTypeCard({
  selected,
  onPress,
  icon,
  title,
  description,
}: UserTypeCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-4 w-full px-4 py-4 rounded-xl border cursor-pointer ${
        selected
          ? 'border-brand bg-brand-tint dark:bg-dk-card'
          : 'border-gray-200 dark:border-dk-border bg-card dark:bg-brand/20'
      }`}
    >
      <View className="w-6 items-center">{icon}</View>
      <View className="flex-1">
        <Text className="font-geist-semibold text-sm text-ink dark:text-dk-text">
          {title}
        </Text>
        <Text className="font-geist text-xs text-gray-400 dark:text-dk-body mt-0.5">
          {description}
        </Text>
      </View>
      {selected ? (
        <CheckCircle2
          size={18}
          color={isDark ? '#F7F3EC' : '#1A1714'}
          strokeWidth={2.25}
        />
      ) : null}
    </Pressable>
  );
}
