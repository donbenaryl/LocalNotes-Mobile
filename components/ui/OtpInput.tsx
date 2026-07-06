import { useRef } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function OtpInput({ value, onChange }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  function handleChange(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(cleaned);
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={focusInput}
      className="flex-row justify-between w-full"
    >
      {digits.map((digit, index) => {
        const isFocused = index === value.length && value.length < OTP_LENGTH;

        return (
          <View
            key={index}
            className={`w-[14.5%] aspect-square items-center justify-center rounded-2xl border ${
              isFocused ? 'border-brand' : 'border-gray-200 dark:border-gray-600'
            } bg-white dark:bg-gray-800`}
          >
            <TextInput
              editable={false}
              value={digit}
              className="text-ink dark:text-gray-100 text-2xl font-geist-bold text-center"
              pointerEvents="none"
            />
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoFocus
        className="absolute opacity-0 w-0 h-0"
      />
    </TouchableOpacity>
  );
}
