import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { CountryCode } from "libphonenumber-js";
import { Check, Search } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { cn } from "@/utils/cn";
import { filterCountries, type Country } from "@/utils/countries";

interface CountryPickerModalProps {
  visible: boolean;
  selected: CountryCode;
  onSelect: (code: CountryCode) => void;
  onClose: () => void;
}

export function CountryPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: CountryPickerModalProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const listMaxHeight = Math.round(height * 0.5);

  // Wait for the keyboard to hide before presenting the sheet, like DropDown.
  useEffect(() => {
    if (!visible) {
      setModalVisible(false);
      return;
    }
    setQuery("");

    let cancelled = false;
    let hideListener: { remove: () => void } | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const showModal = () => {
      if (!cancelled) setModalVisible(true);
    };

    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      hideListener = Keyboard.addListener("keyboardDidHide", () => {
        hideListener?.remove();
        if (timeoutId) clearTimeout(timeoutId);
        showModal();
      });
      timeoutId = setTimeout(showModal, 400);
    } else {
      showModal();
    }

    return () => {
      cancelled = true;
      hideListener?.remove();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible]);

  const countries = useMemo(() => filterCountries(query), [query]);

  const handleSelect = (code: CountryCode) => {
    onSelect(code);
    onClose();
  };

  const renderItem = ({ item }: { item: Country }) => {
    const isSelected = item.code === selected;
    return (
      <Pressable
        onPress={() => handleSelect(item.code)}
        className={cn(
          "flex-row items-center gap-3 rounded-xl px-4 py-4 cursor-pointer active:opacity-80",
          isSelected
            ? "bg-brand-tint dark:bg-brand/20 border border-brand/30 dark:border-brand/50"
            : "border border-transparent",
        )}
      >
        <Text className="text-2xl">{item.flag}</Text>
        <Text
          className={cn(
            "flex-1 font-geist text-base",
            isSelected ? "font-geist-medium text-brand" : "text-ink dark:text-gray-100",
          )}
          numberOfLines={1}
        >
          {item.name} (+{item.dialCode})
        </Text>
        {isSelected ? <Check size={18} color="#FF6B1A" strokeWidth={2.5} /> : null}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={modalVisible}
      onClose={onClose}
      position="bottom"
      title={t("phoneVerification.selectCountry")}
      withCloseIcon
      avoidKeyboard={false}
    >
      <View>
        <View className="relative mb-2">
          <TextInput
            placeholder={t("phoneVerification.searchCountry")}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            containerClassName="mb-0"
            style={{ paddingLeft: 40 }}
          />
          <View className="pointer-events-none absolute bottom-0 left-4 top-0 justify-center">
            <Search size={18} color="#9CA3AF" />
          </View>
        </View>
        <FlatList
          data={countries}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          style={{ maxHeight: listMaxHeight }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          ListEmptyComponent={
            <Text className="py-6 text-center font-geist text-sm text-gray-500 dark:text-gray-400">
              {t("phoneVerification.noCountries")}
            </Text>
          }
        />
      </View>
    </Modal>
  );
}
