import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';

interface SettingsNavRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}

export function SettingsNavRow({
  title,
  subtitle,
  value,
  icon: Icon,
  danger = false,
  disabled = false,
  showChevron = true,
  onPress,
  isLast = false,
}: SettingsNavRowProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = danger
    ? '#EF4444'
    : isDark
      ? '#A79E92'
      : '#6C727F';
  const titleClass = danger
    ? 'font-geist-medium text-[15px] text-red-500'
    : 'font-geist-medium text-[15px] text-ink dark:text-dk-text';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      className={`flex-row items-center gap-3 py-3.5 cursor-pointer ${
        disabled ? 'opacity-50' : ''
      } ${isLast ? '' : 'border-b border-gray-100 dark:border-dk-line'}`}
    >
      {Icon ? (
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-dk-card">
          <Icon size={16} color={iconColor} />
        </View>
      ) : null}
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className={titleClass}>{title}</Text>
        {subtitle ? (
          <Text className="font-geist text-[12px] leading-[16px] text-gray-500 dark:text-dk-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text
          className="shrink-0 font-geist text-[13px] text-gray-400 dark:text-dk-faint"
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      {showChevron ? (
        <ChevronRight size={16} color={isDark ? '#8F877C' : '#9EA4AF'} />
      ) : null}
    </Pressable>
  );
}
