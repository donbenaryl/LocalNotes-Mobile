import { useEffect } from 'react';
import { Text, View } from 'react-native';
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
  required?: boolean;
}

function statusClassName(status: UsernameAvailabilityStatus): string {
  if (status === 'available') return 'text-green-600 dark:text-green-400';
  if (status === 'checking') return 'text-gray-500 dark:text-gray-400';
  if (status === 'taken' || status === 'invalid') {
    return 'text-error';
  }
  return 'text-gray-400 dark:text-gray-500';
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
  required,
}: UsernameFieldProps) {
  const { t } = useTranslation();
  const { status, message } = useUsernameAvailability({
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

  const hint =
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
      {hint ? (
        <Text
          className={cn('text-sm font-geist mt-1.5', statusClassName(status))}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
