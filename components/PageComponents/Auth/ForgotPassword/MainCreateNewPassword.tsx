import { Alert, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../ui/KeyboardAwareScrollView';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TextInput } from '../../../ui/TextInput';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';
import { InputHint } from '../../../ui/InputHint';
import { resetPassword } from '../../../../services/authService';

interface FormState {
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function useValidate() {
  const { t } = useTranslation();
  return function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.password) {
      errors.password = t('validation.passwordRequired');
    } else if (form.password.length < 8) {
      errors.password = t('validation.passwordTooShort');
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
      errors.password = t('validation.passwordWeakFormat');
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = t('validation.passwordsMismatch');
    }
    return errors;
  };
}

export function MainCreateNewPassword() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  const validate = useValidate();

  const [form, setForm] = useState<FormState>({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  function setField(key: keyof FormState) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };
  }

  const mutation = useMutation({
    mutationFn: () => resetPassword(email ?? '', code ?? '', form.password),
    onSuccess: () => {
      router.replace('/(auth)/password-updated' as Href);
    },
    onError: (error: Error) => {
      Alert.alert(t('alerts.resetFailed'), error.message);
    },
  });

  function handleReset() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    mutation.mutate();
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-white dark:bg-gray-900"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
        <View style={{ paddingTop: insets.top + 25 }} className="px-6 mb-8">
          <PageTitleHeading title={t('auth.createNewPassword.title')} />
        </View>

        <View className="px-6 gap-4">
          <TextInput
            label={t('auth.createNewPassword.passwordLabel')}
            placeholder={t('auth.createNewPassword.passwordPlaceholder')}
            value={form.password}
            onChangeText={setField('password')}
            isPassword
            autoComplete="new-password"
            error={errors.password}
          />

          <InputHint hint={t('common.passwordHint')} />

          <TextInput
            label={t('auth.createNewPassword.confirmPasswordLabel')}
            placeholder={t('auth.createNewPassword.confirmPasswordPlaceholder')}
            value={form.confirmPassword}
            onChangeText={setField('confirmPassword')}
            isPassword
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        </View>

        <View className="px-6 mt-8">
          <LocalNotesButton
            label={mutation.isPending ? t('auth.createNewPassword.resetting') : t('auth.createNewPassword.resetPassword')}
            onPress={handleReset}
            variant="dark"
          />
        </View>
    </KeyboardAwareScrollView>
  );
}
