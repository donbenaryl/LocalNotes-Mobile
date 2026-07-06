import { Alert, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../ui/KeyboardAwareScrollView';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TextInput } from '../../../ui/TextInput';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';
import { forgotPassword } from '../../../../services/authService';

interface FormState {
  email: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function useValidate() {
  const { t } = useTranslation();
  return function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.email.trim()) {
      errors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = t('validation.emailInvalid');
    }
    return errors;
  };
}

export function MainForgotPassword() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const validate = useValidate();

  const [form, setForm] = useState<FormState>({ email: '' });
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
    mutationFn: () => forgotPassword(form.email.trim().toLowerCase()),
    onSuccess: () => {
      router.push({
        pathname: '/(auth)/forgot-password-otp',
        params: { email: form.email.trim().toLowerCase() },
      });
    },
    onError: (error: Error) => {
      Alert.alert(t('alerts.error'), error.message);
    },
  });

  function handleSend() {
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
          <PageTitleHeading title={t('auth.forgotPassword.title')} />
        </View>

        <View className="px-6 gap-4">
          <TextInput
            label={t('auth.forgotPassword.emailLabel')}
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
            value={form.email}
            onChangeText={setField('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
        </View>

        <View className="px-6 mt-8">
          <LocalNotesButton
            label={mutation.isPending ? t('common.sending') : t('auth.forgotPassword.send')}
            onPress={handleSend}
            variant="dark"
          />
        </View>
    </KeyboardAwareScrollView>
  );
}
