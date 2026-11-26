import { ReactNode } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";
import { BRAND } from "@/constants/colors";

type LocalNotesButtonSize = "xs" | "sm" | "md" | "lg";
type LocalNotesButtonVariant =
  | "dark"
  | "light"
  | "brand"
  | "danger"
  | "ghost"
  | "outline";

interface LocalNotesButtonProps {
  label: string;
  onPress: () => void;
  variant?: LocalNotesButtonVariant;
  size?: LocalNotesButtonSize;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
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
  light: "bg-card dark:bg-dk-card border border-gray-200 dark:border-dk-border",
  brand: "bg-brand dark:bg-dk-text border border-brand dark:border-dk-text",
  danger: "bg-red-700 border border-red-700",
  ghost: "bg-transparent border border-transparent",
  outline: "bg-transparent border border-white",
};

const VARIANT_TEXT_CLASS: Record<LocalNotesButtonVariant, string> = {
  dark: "text-white dark:text-ink",
  light: "text-ink dark:text-dk-text",
  brand: "text-white dark:text-ink",
  danger: "text-white",
  ghost: "text-gray-500 dark:text-dk-muted",
  outline: "text-white",
};

export function LocalNotesButton({
  label,
  onPress,
  variant = "dark",
  size = "md",
  disabled = false,
  className = "",
  textClassName = "",
  isRounded = false,
  leftIcon,
  rightIcon,
  isWidthFull = true,
  loading = false,
}: LocalNotesButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isDisabled = disabled || loading;
  const keepsStyleWhenDisabled = variant === "danger" || variant === "outline";

  const containerClass = isDisabled
    ? keepsStyleWhenDisabled
      ? `${VARIANT_CONTAINER_CLASS[variant]} opacity-50`
      : "bg-disabled dark:bg-dk-elevated"
    : VARIANT_CONTAINER_CLASS[variant];

  const textClass = textClassName
    ? textClassName
    : isDisabled && !keepsStyleWhenDisabled
      ? "text-white"
      : VARIANT_TEXT_CLASS[variant];

  const spinnerColor =
    variant === "light" || (variant === "brand" && isDark)
      ? BRAND
      : "#FFFFFF";

  return (
    <TouchableOpacity
      className={`${isRounded ? "rounded-full" : "rounded-xl"} ${SIZE_CONTAINER_CLASS[size]} items-center ${isWidthFull ? "w-full" : "self-start"} cursor-pointer ${containerClass} ${className} px-4`}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
    >
      <View className="shrink-0 flex-row items-center justify-center gap-2">
        {leftIcon ? <View className="shrink-0">{leftIcon}</View> : null}
        {label ? (
          <Text className={`shrink-0 font-geist ${SIZE_TEXT_CLASS[size]} ${textClass}`}>
            {label}
          </Text>
        ) : null}
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
