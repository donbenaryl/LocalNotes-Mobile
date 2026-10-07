import { useMemo, useState } from "react";
import { Pressable, Text, TextInput as RNTextInput, View } from "react-native";
import {
  AsYouType,
  getCountryCallingCode,
  getExampleNumber,
  type CountryCode,
} from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { ChevronDown } from "lucide-react-native";
import { CountryPickerModal } from "@/components/ui/CountryPickerModal";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { cn } from "@/utils/cn";
import { getCountry } from "@/utils/countries";

interface PhoneInputProps {
  /** National number as typed (formatted or not). */
  value: string;
  country: CountryCode;
  onChangeText: (value: string) => void;
  onChangeCountry: (country: CountryCode) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  onSubmitEditing?: () => void;
  containerClassName?: string;
}

const digitsOf = (text: string) => text.replace(/\D/g, "");

export function PhoneInput({
  value,
  country,
  onChangeText,
  onChangeCountry,
  label,
  placeholder,
  error,
  onSubmitEditing,
  containerClassName,
}: PhoneInputProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const selected = getCountry(country);

  const examplePlaceholder = useMemo(
    () => getExampleNumber(country, examples)?.formatNational() ?? placeholder,
    [country, placeholder],
  );

  const handleChange = (text: string) => {
    let digits = digitsOf(text);
    // Deleting a formatting character (e.g. ")") leaves the digits unchanged; drop a digit instead.
    if (text.length < value.length && digits === digitsOf(value)) {
      digits = digits.slice(0, -1);
    }
    onChangeText(new AsYouType(country).input(digits));
  };

  return (
    <View className={cn("w-full", containerClassName)}>
      {label ? <FieldLabel label={label} /> : null}
      <View
        className={cn(
          "h-14 flex-row items-center rounded-xl border bg-gray-50 px-4 dark:bg-gray-800",
          error ? "border-error" : "border-gray-100 dark:border-gray-700",
        )}
      >
        <Pressable
          onPress={() => setPickerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`${selected.name} +${selected.dialCode}`}
          hitSlop={8}
          className="flex-row items-center gap-1.5 cursor-pointer"
        >
          <Text className="text-xl">{selected.flag}</Text>
          <Text className="font-geist text-base text-ink dark:text-gray-100">{selected.code}</Text>
          <ChevronDown size={16} color="#6B7280" />
        </Pressable>
        <View className="mx-3 h-6 w-px bg-gray-200 dark:bg-gray-600" />
        <Text className="mr-2 font-geist text-base text-gray-500 dark:text-gray-400">
          +{getCountryCallingCode(country)}
        </Text>
        <RNTextInput
          className="flex-1 text-ink dark:text-gray-100 font-geist text-base py-0 text-[16px]"
          // NativeWind can't express these; they keep the placeholder vertically centered like the value.
          style={{ textAlignVertical: "center", includeFontPadding: false }}
          placeholder={examplePlaceholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="done"
          onSubmitEditing={onSubmitEditing}
          maxLength={24}
        />
      </View>
      {error ? <Text className="mt-1 font-geist text-xs text-error">{error}</Text> : null}
      <CountryPickerModal
        visible={pickerVisible}
        selected={country}
        onSelect={onChangeCountry}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
