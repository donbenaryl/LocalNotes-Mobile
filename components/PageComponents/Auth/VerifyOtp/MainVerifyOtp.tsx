import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../ui/KeyboardAwareScrollView';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { OtpInput } from '../../../ui/OtpInput';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';
import { verifyOtp, sendOtp } from '../../../../services/authService';
import { useAuthStore } from '../../../../stores/useAuthStore';

export function MainVerifyOtp() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email, flow } = useLocalSearchParams<{ email: string; flow: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [code, setCode] = useState('');

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp(email ?? '', code),
    onSuccess: async (data) => {
      await setAuth(data.user, data.token);
      if (flow === 'sign-up-business') {
        router.replace('/(tabs)' as Href);
      } else {
        router.replace('/(quiz)/discover' as Href);
      }
    },
    onError: (error: Error) => {
      Alert.alert(t('alerts.verificationFailed'), error.message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => sendOtp(email ?? ''),
    onSuccess: () => {
      Alert.alert(t('alerts.codeSent'), t('alerts.codeSentMessage'));
    },
    onError: (error: Error) => {
      Alert.alert(t('alerts.resendFailed'), error.message);
    },
  });

  function handleVerify() {
    if (code.length < 6) return;
    verifyMutation.mutate();
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
          <LocalNotesButton
            label={verifyMutation.isPending ? t('auth.verifyOtp.verifying') : t('auth.verifyOtp.verifyCode')}
            onPress={handleVerify}
            disabled={!isCodeComplete || verifyMutation.isPending}
          />
        </View>

        <View className="flex-row justify-center items-center mt-12">
          <Text className="font-geist text-lg text-ink dark:text-gray-300">
            {t('auth.verifyOtp.noCode')}
            <TouchableOpacity
              onPress={() => resendMutation.mutate()}
              activeOpacity={0.7}
              className="cursor-pointer"
            >
              <Text className="text-brand font-geist-medium text-lg leading-tight mt-[-2] ml-1">
                {resendMutation.isPending ? t('common.sending') : t('auth.verifyOtp.resend')}
              </Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
