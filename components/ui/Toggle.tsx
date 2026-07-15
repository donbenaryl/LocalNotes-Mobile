import { Pressable, Text, View } from "react-native";
import { cn } from "@/utils/cn";

const ACTIVE_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
} as const;

const THUMB_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.12,
  shadowRadius: 2,
  elevation: 2,
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

interface SwitchToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
  disabled?: boolean;
}

/** Boolean on/off toggle without text labels — for settings rows. */
export function SwitchToggle({
  value,
  onChange,
  className,
  disabled = false,
}: SwitchToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      className={cn(
        "h-[26px] w-[44px] justify-center rounded-full p-0.5 cursor-pointer",
        value ? "bg-brand/30" : "bg-gray-200 dark:bg-gray-700",
        disabled ? "opacity-50" : "",
        className,
      )}
    >
      <View
        className={cn(
          "h-[22px] w-[22px] rounded-full bg-brand",
          value ? "self-end" : "self-start",
        )}
        style={THUMB_SHADOW}
      />
    </Pressable>
  );
}
