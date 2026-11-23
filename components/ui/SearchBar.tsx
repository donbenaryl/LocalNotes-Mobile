import { useState } from "react";
import {
  Pressable,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { cn } from "@/utils/cn";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Called on clear — wire to store.commitQuery. Search itself is triggered externally. */
  onCommit: (query: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onCommit,
  onClear,
  onFocus,
  onBlur,
  placeholder,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#A79E92" : "#6C727F";
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText("");
    onCommit("");
    onClear?.();
  };

  return (
    <View className={cn("flex-row items-center gap-2", className)}>
      <View
        className={cn(
          "min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border bg-soft px-3 dark:bg-dk-card",
          isFocused
            ? "border-brand"
            : "border-gray-200 dark:border-dk-border",
        )}
      >
        <Search size={16} color={iconColor} />
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder ?? t("search.placeholder")}
          placeholderTextColor="#6B7280"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          onSubmitEditing={() => onCommit(value)}
          className="flex-1 py-3 text-[16px] font-geist text-ink dark:text-dk-text"
        />
        {value.length > 0 ? (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("search.clear")}
            className="cursor-pointer rounded-full p-1"
          >
            <X size={14} color={iconColor} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
