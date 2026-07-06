import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Check, Search } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingValue, setPendingValue] = useState(selected);

  useEffect(() => {
    if (visible) {
      setPendingValue(selected);
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

  const handleApply = () => {
    onApply(pendingValue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      footer={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <LocalNotesButton
              label={t("common.cancel")}
              onPress={onClose}
              variant="light"
            />
          </View>
          <View className="flex-1">
            <LocalNotesButton
              label={t("common.apply")}
              onPress={handleApply}
              variant="brand"
            />
          </View>
        </View>
      }
    >
      <KeyboardAwareScrollView
        scrollToFocusedInput
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 88 }}
      >
        <View className={cn(isSearchable ? "mb-4" : "")}>
          {isSearchable && (
            <View className="relative">
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
          )}

          <ScrollView
            className="mt-3"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-2">
              {filteredOptions.map((option) => {
                const isSelected = pendingValue === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setPendingValue(option.value)}
                    className={cn(
                      "flex-row items-center justify-between rounded-xl px-4 py-5 cursor-pointer active:opacity-80",
                      isSelected
                        ? "bg-brand-tint dark:bg-brand/20 border border-brand/30 dark:border-brand/50"
                        : "bg-soft dark:bg-gray-800 border border-transparent",
                    )}
                  >
                    <Text
                      className={cn(
                        "font-geist text-base flex-1 pr-3",
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
      </KeyboardAwareScrollView>
    </Modal>
  );
}
