import { Pressable, Text, View } from "react-native";
import { LocalNotesButton } from "./LocalNotesButton";

interface FilterHeaderProps {
  title: string;
  accentTitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function FilterHeader({
  title,
  accentTitle,
  actionLabel,
  onAction,
}: FilterHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <View className="flex-row items-baseline">
        <Text className="font-geist-bold text-2xl text-ink dark:text-gray-100">
          {title}{" "}
        </Text>
        <Text className="italic text-2xl text-brand">{accentTitle}</Text>
      </View>
      {actionLabel && onAction ? (
        <LocalNotesButton
          label={actionLabel}
          onPress={onAction}
          variant="light"
          size="xs"
          isWidthFull={false}
        />
  
      ) : null}
    </View>
  );
}
