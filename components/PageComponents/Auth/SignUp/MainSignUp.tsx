import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../ui/KeyboardAwareScrollView';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { ArrowRight } from 'lucide-react-native';
import { TextInput } from '../../../ui/TextInput';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';
import { SocialAuthButton } from '../../../ui/SocialAuthButton';
import { Checkbox } from '../../../ui/Checkbox';
import authService from '../../../../http/auth-api/auth.service';
import { toast } from '../../../ui/Toast';
import { EnterOTP } from './EnterOTP';
import { MainOnBoarding } from '../OnBoarding/MainOnBoarding';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { ContinueWith } from '../ContinueWith';

type Step = 'email' | 'verify' | 'onboarding';

export function MainSignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return t('validation.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return t('validation.emailInvalid');
    }
    return undefined;
  }

  const signUpMutation = useMutation({
    mutationFn: async (normalizedEmail: string) => {
      const response = await authService.SignUp({ email: normalizedEmail });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? t('auth.signUp.signUpSuccess'));
      setStep('verify');
    },
    onError: (error: Error) => {
      toast.error(error.message, { title: t('alerts.signUpFailed') });
    },
  });

  function handleEmailSubmit() {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    if (!agreed) {
      toast.error(t('auth.signUp.consent.error'));
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setUserEmail(normalizedEmail);
    signUpMutation.mutate(normalizedEmail);
  }

  function handleSocialAuth(provider: 'google' | 'apple') {
    Alert.alert(
      t('alerts.comingSoon'),
      provider === 'google'
        ? t('alerts.comingSoonGoogle')
        : t('alerts.comingSoonApple'),
    );
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-page dark:bg-gray-900"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
        <View style={{ paddingTop: insets.top + 25 }} className="px-6 mb-8">
          <PageTitleHeading
            title={t("auth.signUp.welcomeTitle")}
            subtitle={t("auth.signUp.welcomeHighlight")}
            description={t("auth.signUp.welcomeDescription")}
          />
        </View>
        <View className="px-6">
          {step === 'email' ? (
            <View>
              <TextInput
                label={t('auth.signUp.emailLabel')}
                placeholder={t('auth.signUp.emailPlaceholder')}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError(undefined);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
                containerClassName="mb-5"
              />

              <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-brand-dark mb-2.5">
                {t('auth.signUp.consent.badge')}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAgreed((prev) => !prev)}
                className="flex-row gap-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-paper dark:bg-gray-800 p-4 mb-6"
              >
                <View className="pt-0.5">
                  <Checkbox checked={agreed} onChange={setAgreed} size={26} />
                </View>

                <View className="flex-1">
                  <Text className="font-geist-semibold text-[15px] leading-snug text-ink dark:text-gray-100">
                    {t('auth.signUp.consent.agreement')}
                  </Text>

                  <Text className="font-geist text-[13.5px] leading-relaxed text-gray-500 dark:text-gray-400 mt-1.5">
                    {t('auth.signUp.consent.description')}
                  </Text>

                  <View className="flex-row flex-wrap gap-x-5 gap-y-1.5 mt-3">
                    <Text
                      className="font-geist-medium text-[13.5px] text-brand underline cursor-pointer"
                      onPress={() => router.push('/terms' as Href)}
                    >
                      {t('auth.signUp.consent.terms')}
                    </Text>
                    <Text
                      className="font-geist-medium text-[13.5px] text-brand underline cursor-pointer"
                      onPress={() => router.push('/privacy-policy' as Href)}
                    >
                      {t('auth.signUp.consent.privacy')}
                    </Text>
                    <Text
                      className="font-geist-medium text-[13.5px] text-brand underline cursor-pointer"
                      onPress={() => router.push('/community-guidelines' as Href)}
                    >
                      {t('auth.signUp.consent.guidelines')}
                    </Text>
               
                  </View>
                </View>
              </TouchableOpacity>

              <LocalNotesButton
                label={
                  signUpMutation.isPending
                    ? t('common.pleaseWait')
                    : t('common.continue')
                }
                onPress={handleEmailSubmit}
                variant="dark"
                disabled={signUpMutation.isPending || !agreed}
                rightIcon={
                  <ArrowRight
                    size={18}
                    color={colorScheme === 'dark' ? '#141413' : '#FFFFFF'}
                  />
                }
              />

            </View>
          ) : null}

          {step === 'verify' ? (
            <EnterOTP
              email={userEmail}
              onVerified={() => setStep('onboarding')}
              onChangeEmail={() => {
                setStep('email');
                setEmail(userEmail);
              }}
            />
          ) : null}

          {step === 'onboarding' ? (
            <MainOnBoarding
              onComplete={() => router.replace('/personality' as Href)}
            />
          ) : null}
        </View>

        {step === 'email' ? (
          <ContinueWith
            promptText={t('auth.signUpFooter.haveAccount')}
            linkText={t('auth.signUpFooter.signIn')}
            onLinkPress={() => router.replace('/sign-in' as Href)}
            onSocialAuth={handleSocialAuth}
          />
        ) : null}
    </KeyboardAwareScrollView>
  );
}
