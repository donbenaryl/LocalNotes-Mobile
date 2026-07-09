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
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onCommit,
  onClear,
  placeholder,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#9CA3AF" : "#6B7280";
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
          "min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border bg-soft px-3 dark:bg-gray-800",
          isFocused
            ? "border-brand"
            : "border-gray-200 dark:border-gray-700",
        )}
      >
        <Search size={16} color={iconColor} />
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder ?? t("search.placeholder")}
          placeholderTextColor="#6B7280"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          className="flex-1 py-3 font-geist text-base text-ink dark:text-gray-100"
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
