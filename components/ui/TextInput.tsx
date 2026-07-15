import { useState } from "react";
import {
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { TextInputProps as RNTextInputProps } from "react-native";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { cn } from "@/utils/cn";

interface TextInputProps extends Omit<
  RNTextInputProps,
  "secureTextEntry" | "className"
> {
  label?: string;
  required?: boolean;
  hint?: string;
  isPassword?: boolean;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export function TextInput({
  label,
  required,
  hint,
  isPassword = false,
  error,
  containerClassName,
  multiline = false,
  textAlignVertical,
  maxLength,
  value,
  labelClassName = "",
  ...props
}: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isMultiline = multiline === true;
  const characterCount = typeof value === "string" ? value.length : 0;
  const shouldShowCounter = isMultiline && maxLength != null;

  return (
    <View className={cn("w-full", containerClassName)}>
      {label ? <FieldLabel label={label} required={required} hint={hint} className={labelClassName} /> : null}
      <View
        className={cn(
          "flex-row bg-gray-50 dark:bg-gray-800 border rounded-xl px-4",
          isMultiline ? "relative items-start py-3 min-h-35" : "items-center h-14",
          error ? "border-error" : "border-gray-100 dark:border-gray-700",
        )}
      >
        <RNTextInput
          className={cn(
            "flex-1 text-ink dark:text-gray-100 font-geist text-base",
            isMultiline && shouldShowCounter ? "pb-7" : "",
          )}
          placeholderTextColor="#6B7280"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? "none" : props.autoCapitalize}
          multiline={multiline}
          maxLength={maxLength}
          value={value}
          textAlignVertical={
            isMultiline ? (textAlignVertical ?? "top") : textAlignVertical
          }
          {...props}
        />
        {isPassword && !isMultiline && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="cursor-pointer"
          >
            <Text className="text-gray-400 font-geist-medium text-sm">
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        )}
        {shouldShowCounter ? (
          <Text
            className={cn(
              "absolute bottom-3 right-4 font-geist text-xs",
              characterCount > maxLength ? "text-error" : "text-gray-500 dark:text-gray-400",
            )}
          >
            {characterCount} / {maxLength}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text className="text-error text-xs mt-1 font-geist">{error}</Text>
      ) : null}
    </View>
  );
}
