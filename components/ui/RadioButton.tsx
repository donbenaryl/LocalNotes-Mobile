import { TouchableOpacity, View } from 'react-native';

interface RadioButtonProps {
  selected: boolean;
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
  className?: string;
}

export function RadioButton({
  selected,
  onPress,
  size = 20,
  disabled = false,
  className = '',
}: RadioButtonProps) {
  const innerSize = size * 0.4;

  const indicator = (
    <View
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      className={`items-center justify-center rounded-full border-2 ${
        selected ? 'border-brand' : 'border-gray-300 dark:border-gray-600'
      } ${disabled ? 'opacity-50' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {selected ? (
        <View
          className="rounded-full bg-brand"
          style={{ width: innerSize, height: innerSize }}
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled }}
        className="cursor-pointer"
      >
        {indicator}
      </TouchableOpacity>
    );
  }

  return indicator;
}
