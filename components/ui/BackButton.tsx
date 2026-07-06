import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
}

function ArrowLeft() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke="#111827"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
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
