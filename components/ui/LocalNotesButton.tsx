import { ReactNode } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type LocalNotesButtonSize = "xs" | "sm" | "md" | "lg";
type LocalNotesButtonVariant = "dark" | "light" | "brand";

interface LocalNotesButtonProps {
  label: string;
  onPress: () => void;
  variant?: LocalNotesButtonVariant;
  size?: LocalNotesButtonSize;
  disabled?: boolean;
  className?: string;
  isRounded?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isWidthFull?: boolean;
  loading?: boolean;
}

const SIZE_CONTAINER_CLASS: Record<LocalNotesButtonSize, string> = {
  xs: "py-2",
  sm: "py-3",
  md: "py-4",
  lg: "py-5",
};

const SIZE_TEXT_CLASS: Record<LocalNotesButtonSize, string> = {
  xs: "text-sm",
  sm: "text-md",
  md: "text-lg",
  lg: "text-xl",
};

const VARIANT_CONTAINER_CLASS: Record<LocalNotesButtonVariant, string> = {
  dark: "bg-ink dark:bg-paper border border-ink dark:border-paper",
  light: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
  brand: "bg-brand border-brand",
};

const VARIANT_TEXT_CLASS: Record<LocalNotesButtonVariant, string> = {
  dark: "text-white dark:text-ink",
  light: "text-ink dark:text-gray-100",
  brand: "text-white",
};

export function LocalNotesButton({
  label,
  onPress,
  variant = "dark",
  size = "md",
  disabled = false,
  className = "",
  isRounded = false,
  leftIcon,
  rightIcon,
  isWidthFull = true,
  loading = false,
}: LocalNotesButtonProps) {
  const isDisabled = disabled || loading;

  const containerClass = isDisabled
    ? "bg-disabled dark:bg-gray-700"
    : VARIANT_CONTAINER_CLASS[variant];

  const textClass = isDisabled ? "text-white" : VARIANT_TEXT_CLASS[variant];

  const spinnerColor = variant === "light" ? "#191B1C" : "#FFFFFF";

  return (
    <TouchableOpacity
      className={`${isRounded ? "rounded-full" : "rounded-xl"} ${SIZE_CONTAINER_CLASS[size]} items-center ${isWidthFull ? "w-full" : "self-start"} cursor-pointer ${containerClass} ${className} px-4`}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
    >
      <View className="shrink-0 flex-row items-center justify-center gap-2">
        {leftIcon ? <View className="shrink-0">{leftIcon}</View> : null}
        {label ? <Text className={`shrink-0 font-geist ${SIZE_TEXT_CLASS[size]} ${textClass}`}>{label}</Text> : null}
        {loading ? (
          <View className="shrink-0">
            <ActivityIndicator size="small" color={spinnerColor} />
          </View>
        ) : null}
        {rightIcon ? <View className="shrink-0">{rightIcon}</View> : null}
      </View>
    </TouchableOpacity>
  );
}
