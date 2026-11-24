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
      className={`flex-1 px-4 py-4 rounded-xl border cursor-pointer ${
        selected
          ? 'border-brand bg-brand-tint dark:bg-dk-card'
          : 'border-gray-200 dark:border-dk-border bg-card dark:bg-brand/20'
      }`}
    >
      <View className="flex-row items-center gap-2">
        <View className="w-6 items-center">{icon}</View>
        <Text
          className="flex-1 font-geist-semibold text-md text-ink dark:text-dk-text"
          numberOfLines={1}
        >
          {title}
        </Text>
        {selected ? (
          <CheckCircle2
            size={18}
            color={isDark ? '#F7F3EC' : '#1A1714'}
            strokeWidth={2.25}
          />
        ) : null}
      </View>
      <Text className="font-geist text-sm text-gray-400 dark:text-dk-body mt-2">
        {description}
      </Text>
    </Pressable>
  );
}
