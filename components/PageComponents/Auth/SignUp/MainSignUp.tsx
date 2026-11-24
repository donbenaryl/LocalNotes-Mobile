import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../ui/KeyboardAwareScrollView';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { ArrowRight } from 'lucide-react-native';
import { TextInput } from '../../../ui/TextInput';
import { UsernameField } from '../../../ui/UsernameField';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';
import { SocialAuthButton } from '../../../ui/SocialAuthButton';
import authService from '../../../../http/auth-api/auth.service';
import { toast } from '../../../ui/Toast';
import { EnterOTP } from './EnterOTP';
import { PageTitleHeading } from '@/components/ui/PageTitleHeading';
import { TermsConsent } from '../TermsConsent';
import { useOnboardingForm } from '@/hooks/useOnboardingForm';
import { UserTypeCard } from '../OnBoarding/UserTypeCard';
import { OnboardingDetailsFields } from '../OnBoarding/OnboardingDetailsFields';
import { UserIcon } from '../../../ui/icons/UserIcon';
import { BuildingIcon } from '../../../ui/icons/BuildingIcon';
import {
  useSocialAuth,
  type SocialAuthResult,
} from '@/hooks/useSocialAuth';
import {
  isUsernameBlocking,
  type UsernameAvailabilityStatus,
} from '@/hooks/useUsernameAvailability';

type Step = 'email' | 'verify' | 'social';

export function MainSignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams<{
    socialComplete?: string;
    suggestedUsername?: string;
  }>();

  const initialSocial =
    params.socialComplete === '1' || params.socialComplete === 'true';

  const [step, setStep] = useState<Step>(initialSocial ? 'social' : 'email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  const mode = step === 'social' ? 'social' : 'email';
  const {
    userType,
    setUserType,
    individualForm,
    setIndividualForm,
    businessForm,
    setBusinessForm,
    username,
    setUsername,
    usernameStatus,
    setUsernameStatus,
    errors,
    clearFieldError,
    validate: validateOnboarding,
    submit: submitOnboarding,
    isSubmitting,
  } = useOnboardingForm(mode);

  const handleSocialNeedsCompletion = useCallback(
    (result: SocialAuthResult) => {
      setAgreed(false);
      if (result.suggestedUsername) {
        setUsername(result.suggestedUsername);
      }
      setStep('social');
    },
    [setUsername],
  );

  const { signInWithProvider, isPending: socialPending } = useSocialAuth({
    onNeedsProfileCompletion: handleSocialNeedsCompletion,
  });

  useEffect(() => {
    if (initialSocial && params.suggestedUsername) {
      setUsername(String(params.suggestedUsername));
    }
  }, [initialSocial, params.suggestedUsername, setUsername]);

  const handleUsernameStatusChange = useCallback(
    (status: UsernameAvailabilityStatus) => {
      setUsernameStatus(status);
    },
    [setUsernameStatus],
  );

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
      toast.error(t('auth.consent.error'));
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

  async function handleSocialComplete() {
    if (!validateOnboarding()) return;
    if (!agreed) {
      toast.error(t('auth.consent.error'));
      return;
    }
    const ok = await submitOnboarding();
    if (ok) {
      router.replace({
        pathname: '/personality',
        params: { fromOnboarding: 'true' },
      } as Href);
    }
  }

  const usernameBlocking = isUsernameBlocking(usernameStatus);
  const createDisabled = useMemo(
    () =>
      signUpMutation.isPending ||
      isSubmitting ||
      !agreed ||
      usernameBlocking,
    [agreed, isSubmitting, signUpMutation.isPending, usernameBlocking],
  );

  const accountTypeSection = (
    <>
      <View className="flex-row items-center gap-2.5 mb-3.5">
        <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500">
          {t('auth.onboarding.accountTypeKicker')}
        </Text>
      </View>

      <View className="flex-row gap-2 mb-6">
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
    </>
  );

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
            {accountTypeSection}

            <View className="mb-5">
              <OnboardingDetailsFields
                userType={userType}
                individualForm={individualForm}
                businessForm={businessForm}
                errors={errors}
                onIndividualChange={setIndividualForm}
                onBusinessChange={setBusinessForm}
                clearFieldError={clearFieldError}
                beforePassword={
                  <>
                    <UsernameField
                      value={username}
                      onChangeText={setUsername}
                      error={errors.username}
                      onStatusChange={handleUsernameStatusChange}
                      hint={t('auth.signUp.usernameHint')}
                      placeholder={t('auth.signUp.usernamePlaceholderAt')}
                      required
                    />
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
                    />
                  </>
                }
              />
            </View>

            <TermsConsent
              agreed={agreed}
              onChange={setAgreed}
              showBadge
              className="mb-4"
            />

            <LocalNotesButton
              label={
                signUpMutation.isPending
                  ? t('common.pleaseWait')
                  : t('auth.signUp.createAccountButton')
              }
              onPress={handleEmailSubmit}
              variant="dark"
              disabled={createDisabled}
              rightIcon={
                <ArrowRight
                  size={18}
                  color={colorScheme === 'dark' ? '#141413' : '#FFFFFF'}
                />
              }
            />

            <View className="flex-row items-center mt-7 mb-7 gap-2">
              <View className="flex-1 h-px bg-gray-200 dark:bg-dk-elevated" />
              <Text className="font-geist text-sm text-gray-500 dark:text-dk-muted">
                {t('auth.signUp.fastestWayIn')}
              </Text>
              <View className="flex-1 h-px bg-gray-200 dark:bg-dk-elevated" />
            </View>
            <View className="flex-row gap-3 mb-5">
              <SocialAuthButton
                provider="google"
                onPress={() => signInWithProvider('google')}
                disabled={socialPending || signUpMutation.isPending || !agreed}
              />
              {Platform.OS === 'ios' ? (
                <SocialAuthButton
                  provider="apple"
                  onPress={() => signInWithProvider('apple')}
                  disabled={socialPending || signUpMutation.isPending || !agreed}
                />
              ) : null}
            </View>

            <View className="flex-row justify-center items-center mt-0 gap-1 mb-4">
              <Text className="font-geist text-gray-500 dark:text-dk-muted">
                {t('auth.signUpFooter.haveAccount')}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/sign-in')}
                hitSlop={8}
                className="cursor-pointer"
              >
                <Text className="font-geist-bold text-brand dark:text-dk-text">
                  {t('auth.signUpFooter.signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {step === 'social' ? (
          <View>
            {accountTypeSection}

            <View className="mb-5">
              <OnboardingDetailsFields
                userType={userType}
                individualForm={individualForm}
                businessForm={businessForm}
                errors={errors}
                onIndividualChange={setIndividualForm}
                onBusinessChange={setBusinessForm}
                clearFieldError={clearFieldError}
                hidePassword
                beforePassword={
                  <UsernameField
                    value={username}
                    onChangeText={setUsername}
                    error={errors.username}
                    onStatusChange={handleUsernameStatusChange}
                    hint={t('auth.signUp.usernameHint')}
                    placeholder={t('auth.signUp.usernamePlaceholderAt')}
                    required
                  />
                }
              />
            </View>

            <TermsConsent
              agreed={agreed}
              onChange={setAgreed}
              showBadge
              className="mb-6"
            />

            <LocalNotesButton
              label={
                isSubmitting
                  ? t('common.pleaseWait')
                  : t('auth.signUp.createAccountButton')
              }
              onPress={() => void handleSocialComplete()}
              variant="dark"
              disabled={createDisabled}
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
            onVerified={() => void handleOtpVerified()}
            onChangeEmail={() => setStep('email')}
          />
        ) : null}
      </View>
    </KeyboardAwareScrollView>
  );
}
