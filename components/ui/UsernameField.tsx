import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextInput } from '@/components/ui/TextInput';
import {
  useUsernameAvailability,
  type UsernameAvailabilityStatus,
} from '@/hooks/useUsernameAvailability';
import { cn } from '@/utils/cn';

interface UsernameFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  currentUsername?: string;
  onStatusChange?: (status: UsernameAvailabilityStatus) => void;
  containerClassName?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

function statusClassName(status: UsernameAvailabilityStatus): string {
  if (status === 'available') return 'text-green-600 dark:text-green-400';
  if (status === 'checking') return 'text-gray-500 dark:text-dk-muted';
  if (status === 'taken' || status === 'invalid') {
    return 'text-error';
  }
  return 'text-gray-400 dark:text-dk-faint';
}

export function UsernameField({
  value,
  onChangeText,
  error,
  currentUsername,
  onStatusChange,
  containerClassName,
  label,
  placeholder,
  hint,
  required,
}: UsernameFieldProps) {
  const { t } = useTranslation();
  const { status, message, suggestions } = useUsernameAvailability({
    username: value,
    currentUsername,
  });

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const displayError =
    error ||
    (status === 'taken' || status === 'invalid'
      ? (message ?? undefined)
      : undefined);

  const statusHint =
    !displayError && message && status !== 'idle' ? message : undefined;

  return (
    <View className={cn('w-full', containerClassName)}>
      <TextInput
        label={label ?? t('auth.signUp.usernameLabel')}
        placeholder={placeholder ?? t('auth.signUp.usernamePlaceholder')}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        error={displayError}
        required={required}
      />
      {hint && !displayError && !statusHint ? (
        <Text className="text-sm font-geist mt-1.5 text-gray-400 dark:text-dk-faint">
          {hint}
        </Text>
      ) : null}
      {statusHint ? (
        <Text
          className={cn('text-sm font-geist mt-1.5', statusClassName(status))}
        >
          {statusHint}
        </Text>
      ) : null}
      {status === 'taken' && suggestions.length > 0 ? (
        <View className="mt-2 gap-2">
          <Text className="text-xs font-geist-medium text-gray-500 dark:text-dk-muted">
            {t('auth.signUp.usernameSuggestions')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => onChangeText(suggestion)}
                className="rounded-full border border-gray-200 dark:border-dk-border bg-card dark:bg-dk-card px-3 py-1.5 cursor-pointer"
              >
                <Text className="font-geist-medium text-sm text-ink dark:text-dk-text">
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
