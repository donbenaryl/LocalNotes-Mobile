import { Pressable, Text, View } from "react-native";
import { cn } from "@/utils/cn";

const ACTIVE_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
} as const;

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
  className?: string;
}

export function Toggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: ToggleProps<T>) {
  return (
    <View
      className={cn(
        "flex-row gap-0.5 rounded-full bg-soft p-1 dark:bg-gray-800",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2",
              isActive ? "bg-white dark:bg-gray-700" : "bg-transparent",
            )}
            style={isActive ? ACTIVE_SHADOW : undefined}
          >
            <Text
              className={cn(
                "text-xs",
                isActive
                  ? "font-geist-bold text-ink dark:text-gray-100"
                  : "font-geist-semibold text-gray-500 dark:text-gray-400",
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
