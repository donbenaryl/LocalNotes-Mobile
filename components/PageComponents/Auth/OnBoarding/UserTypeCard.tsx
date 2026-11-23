import { Pressable, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
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
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-4 w-full px-4 py-4 rounded-xl border cursor-pointer ${
        selected
          ? 'border-brand bg-brand-tint dark:bg-brand/20'
          : 'border-gray-200 dark:border-dk-border bg-card dark:bg-dk-card'
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
        <CheckCircle2 size={18} color="#E76E04" strokeWidth={2.25} />
      ) : null}
    </Pressable>
  );
}
