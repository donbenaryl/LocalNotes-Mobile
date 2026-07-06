import { TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: number;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  size = 24,
  disabled = false,
}: CheckboxProps) {
  const { colorScheme } = useColorScheme();
  const checkColor = colorScheme === 'dark' ? '#141413' : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={() => onChange(!checked)}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      disabled={disabled}
      className={`items-center justify-center rounded-md cursor-pointer ${
        checked
          ? 'bg-ink dark:bg-paper'
          : 'border-2 border-gray-300 dark:border-gray-600'
      } ${disabled ? 'opacity-50' : ''}`}
      style={{ width: size, height: size }}
    >
      {checked ? (
        <Check size={size * 0.62} color={checkColor} strokeWidth={3} />
      ) : null}
    </TouchableOpacity>
  );
}
