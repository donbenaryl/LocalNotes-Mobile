import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
}

export function BackButton({ onPress, label = 'Go back' }: BackButtonProps) {
  const router = useRouter();

  function handlePress() {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="flex-row items-center gap-2"
    >
      {label ? (
        <Text className="text-gray-500 font-geist-medium text-sm">{label}</Text>
      ) : null}
    </TouchableOpacity>
  );
}
