import { Text } from 'react-native';

interface InputHintProps {
  hint: string;
}

export function InputHint({ hint }: InputHintProps) {
  return (
    <Text className="text-sm text-gray-400 font-geist -mt-2">{hint}</Text>
  );
}
