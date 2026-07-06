import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../ui/KeyboardAwareScrollView';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { OtpInput } from '../../../ui/OtpInput';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';
import { forgotPassword } from '../../../../services/authService';

export function MainForgotPasswordOtp() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');

  const resendMutation = useMutation({
    mutationFn: () => forgotPassword(email ?? ''),
    onSuccess: () => {
      Alert.alert(t('alerts.codeSent'), t('alerts.codeSentMessage'));
    },
    onError: (error: Error) => {
      Alert.alert(t('alerts.resendFailed'), error.message);
    },
  });

  function handleVerify() {
    if (code.length < 6) return;
    router.push({
      pathname: '/(auth)/create-new-password',
      params: { email: email ?? '', code },
    });
  }

  const isCodeComplete = code.length === 6;

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-white dark:bg-gray-900"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top + 20 }} className="px-6 mb-16">
        <PageTitleHeading onBack={() => router.back()} />
      </View>

      <View className="px-10 flex-1">
        <View className="mb-14">
          <Text className="font-geist-bold text-3xl text-center text-ink dark:text-gray-100 mb-3">
            {t('auth.verifyOtp.title')}
          </Text>
          <Text className="font-geist text-lg text-ink dark:text-gray-300 text-center px-4 opacity-70">
            {t('auth.verifyOtp.subtitle')}
          </Text>
        </View>

        <OtpInput value={code} onChange={setCode} />

        <View className="mt-16">
          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isCodeComplete}
            className={`rounded-full py-5 items-center w-full cursor-pointer ${
              isCodeComplete ? 'bg-ink dark:bg-paper' : 'bg-disabled dark:bg-gray-700'
            }`}
          >
            <Text className={`font-geist-bold text-lg ${isCodeComplete ? 'text-white dark:text-ink' : 'text-white'}`}>
              {t('auth.verifyOtp.verifyCode')}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center mt-12">
          <Text className="font-geist text-lg text-ink dark:text-gray-300">
            {t('auth.verifyOtp.noCode')}
            <TouchableOpacity
              onPress={() => resendMutation.mutate()}
              activeOpacity={0.7}
              className="cursor-pointer"
            >
              <Text className="text-brand font-geist-medium text-lg leading-tight mt-[-2]">
                {resendMutation.isPending ? t('common.sending') : t('auth.verifyOtp.resend')}
              </Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
