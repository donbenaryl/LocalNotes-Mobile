import { ReactNode } from "react";
import { Pressable, Text } from "react-native";

interface CategoryChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

export function CategoryChip({ label, isSelected, onPress, icon }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-full px-4 py-2 cursor-pointer ${
        isSelected ? "bg-brand" : "bg-gray-100 dark:bg-dk-card"
      }`}
    >
      {icon}
      <Text
        className={`font-geist-medium text-sm ${
          isSelected ? "text-white" : "text-ink dark:text-dk-body"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
