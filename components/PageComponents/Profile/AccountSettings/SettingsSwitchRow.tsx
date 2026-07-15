import { Text, View } from 'react-native';
import { SwitchToggle } from '@/components/ui/Toggle';

interface SettingsSwitchRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

export function SettingsSwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
}: SettingsSwitchRowProps) {
  return (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${
        isLast ? '' : 'border-b border-gray-100 dark:border-gray-800'
      }`}
    >
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-geist-medium text-[15px] text-ink dark:text-gray-100">
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-geist text-[12px] leading-[16px] text-gray-500 dark:text-gray-400">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <SwitchToggle value={value} onChange={onValueChange} />
    </View>
  );
}
