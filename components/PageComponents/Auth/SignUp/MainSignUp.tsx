import { Alert, Text, View } from 'react-native';
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
import { Checkbox } from '../../../ui/Checkbox';
import authService from '../../../../http/auth-api/auth.service';
import { toast } from '../../../ui/Toast';
import { EnterOTP } from './EnterOTP';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { ContinueWith } from '../ContinueWith';
import { useOnboardingForm } from '@/hooks/useOnboardingForm';
import { UserTypeCard } from '../OnBoarding/UserTypeCard';
import { OnboardingDetailsFields } from '../OnBoarding/OnboardingDetailsFields';
import { UserIcon } from '../../../ui/icons/UserIcon';
import { BuildingIcon } from '../../../ui/icons/BuildingIcon';

type Step = 'email' | 'verify';

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

  const {
    userType,
    setUserType,
    individualForm,
    setIndividualForm,
    businessForm,
    setBusinessForm,
    errors,
    clearFieldError,
    validate: validateOnboarding,
    submit: submitOnboarding,
  } = useOnboardingForm();

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
    if (!validateOnboarding()) return;

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

  async function handleOtpVerified() {
    const ok = await submitOnboarding();
    if (ok) {
      router.replace({
        pathname: '/personality',
        params: { fromOnboarding: 'true' },
      } as Href);
    }
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
          title={t('auth.signUp.welcomeTitle')}
          subtitle={t('auth.signUp.welcomeHighlight')}
        />
      </View>
      <View className="px-6">
        {step === 'email' ? (
          <View>
            <View className="flex-row items-center gap-2.5 mb-3.5">
              <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500">
                {t('auth.onboarding.accountTypeKicker')}
              </Text>
            </View>

            <View className="gap-2 mb-6">
              <UserTypeCard
                selected={userType === 'individual'}
                onPress={() => setUserType('individual')}
                icon={<UserIcon />}
                title={t('auth.onboarding.individualTitle')}
                description={t('auth.onboarding.individualDesc')}
              />
              <UserTypeCard
                selected={userType === 'business'}
                onPress={() => setUserType('business')}
                icon={<BuildingIcon />}
                title={t('auth.onboarding.businessTitle')}
                description={t('auth.onboarding.businessDesc')}
              />
            </View>

            <View className="mb-5">
              <OnboardingDetailsFields
                userType={userType}
                individualForm={individualForm}
                businessForm={businessForm}
                errors={errors}
                onIndividualChange={setIndividualForm}
                onBusinessChange={setBusinessForm}
                clearFieldError={clearFieldError}
              />
            </View>

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

            <View className="flex-row gap-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-paper dark:bg-gray-800 p-4 mb-6">
              <View className="pt-0.5">
                <Checkbox checked={agreed} onChange={setAgreed} size={26} />
              </View>

              <View className="flex-1">
                <Text className="font-geist-semibold text-[15px] leading-snug text-ink dark:text-gray-100">
                  {t('auth.signUp.consent.prefix')}
                  <Text
                    className="font-geist-semibold text-[15px] text-brand underline cursor-pointer"
                    onPress={() => router.push('/terms' as Href)}
                  >
                    {t('auth.signUp.consent.terms')}
                  </Text>
                  {t('auth.signUp.consent.separator')}
                  <Text
                    className="font-geist-semibold text-[15px] text-brand underline cursor-pointer"
                    onPress={() => router.push('/privacy-policy' as Href)}
                  >
                    {t('auth.signUp.consent.privacy')}
                  </Text>
                  {t('auth.signUp.consent.andSeparator')}
                  <Text
                    className="font-geist-semibold text-[15px] text-brand underline cursor-pointer"
                    onPress={() =>
                      router.push('/community-guidelines' as Href)
                    }
                  >
                    {t('auth.signUp.consent.guidelines')}
                  </Text>
                  {t('auth.signUp.consent.suffix')}
                </Text>
              </View>
            </View>

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
            onVerified={() => handleOtpVerified()}
            onChangeEmail={() => {
              setStep('email');
              setEmail(userEmail);
            }}
          />
        ) : null}
      </View>

      {step === 'email' ? (
        <ContinueWith
          promptText={t('auth.signUpFooter.haveAccount')}
          linkText={t('auth.signUpFooter.signIn')}
          onLinkPress={() => router.replace('/sign-in' as Href)}
          onSocialAuth={handleSocialAuth}
          socialDisabled={!agreed}
        />
      ) : null}
    </KeyboardAwareScrollView>
  );
}
