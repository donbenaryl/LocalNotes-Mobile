import { Pressable, Text } from "react-native";

interface CategoryChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, isSelected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 cursor-pointer ${
        isSelected ? "bg-brand" : "bg-gray-100 dark:bg-gray-800"
      }`}
    >
      <Text
        className={`font-geist-medium text-sm ${
          isSelected ? "text-white" : "text-ink dark:text-gray-200"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
