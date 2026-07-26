import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Check, Search } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { cn } from "@/utils/cn";

export interface DropDownOption {
  value: string;
  label: string;
}

interface DropDownProps {
  visible: boolean;
  options: DropDownOption[];
  selected: string;
  onApply: (value: string) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  isSearchable?: boolean;
}

export function DropDown({
  visible,
  options,
  selected,
  onApply,
  onClose,
  searchPlaceholder,
  isSearchable,
}: DropDownProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const listMaxHeight = Math.round(height * 0.5);

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
    }
  }, [visible, selected]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  const handleSelect = (value: string) => {
    onApply(value);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} position="bottom" withCloseIcon>
      <View>
        {isSearchable ? (
          <View className="relative mb-4">
            <TextInput
              placeholder={searchPlaceholder ?? t("common.search")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              containerClassName="mb-0"
              style={{ paddingLeft: 40 }}
            />
            <View className="pointer-events-none absolute bottom-0 left-4 top-0 justify-center">
              <Search size={18} color="#9CA3AF" />
            </View>
          </View>
        ) : null}

        <ScrollView
          style={{ maxHeight: listMaxHeight }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            {filteredOptions.map((option) => {
              const isSelected = selected === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  className={cn(
                    "flex-row items-center justify-between rounded-xl px-4 py-5 cursor-pointer active:opacity-80",
                    isSelected
                      ? "bg-brand-tint dark:bg-brand/20 border border-brand/30 dark:border-brand/50"
                      : "bg-soft dark:bg-gray-800 border border-transparent",
                  )}
                >
                  <Text
                    className={cn(
                      "font-geist text-base text-center flex-1 pr-3",
                      isSelected
                        ? "font-geist-medium text-brand"
                        : "text-ink dark:text-gray-100",
                    )}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Check size={18} color="#FF6B1A" strokeWidth={2.5} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
