import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../ui/KeyboardAwareScrollView';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { TextInput } from '../../../ui/TextInput';
import { DateField } from '../../../ui/DateField';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';
import { UserIcon } from '../../../ui/icons/UserIcon';
import { BuildingIcon } from '../../../ui/icons/BuildingIcon';
import accountService from '../../../../http/account-api/account.services';
import type { profileItemDAO } from '../../../../http/account-api/types';
import { toast } from '../../../ui/Toast';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { mapProfileToUser } from '../../../../utils/mapProfileToUser';

type UserType = 'individual' | 'business';
type OnboardingStep = 'userType' | 'details';

interface MainOnBoardingProps {
  onComplete: () => void;
}

interface IndividualForm {
  fullName: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

interface BusinessForm {
  contactName: string;
  dateOfBirth: string;
  businessName: string;
  businessWebsite: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Record<string, string>;

function mapProfileToUserPartial(profile: profileItemDAO) {
  return mapProfileToUser(profile);
}

function UserTypeCard({
  selected,
  onPress,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onPress: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-4 w-full px-4 py-4 rounded-xl border cursor-pointer ${
        selected
          ? 'border-brand bg-brand-tint'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      <View className="w-6 items-center">{icon}</View>
      <View className="flex-1">
        <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100">
          {title}
        </Text>
        <Text className="font-geist text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {description}
        </Text>
      </View>
      {selected ? (
        <CheckCircle2 size={18} color="#E76E04" strokeWidth={2.25} />
      ) : null}
    </Pressable>
  );
}

export function MainOnBoarding({ onComplete }: MainOnBoardingProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const updateUser = useAuthStore((s) => s.updateUser);

  const [step, setStep] = useState<OnboardingStep>('userType');
  const [userType, setUserType] = useState<UserType>('individual');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [individualForm, setIndividualForm] = useState<IndividualForm>({
    fullName: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });

  const [businessForm, setBusinessForm] = useState<BusinessForm>({
    contactName: '',
    dateOfBirth: '',
    businessName: '',
    businessWebsite: '',
    password: '',
    confirmPassword: '',
  });

  function validatePassword(password: string): string | undefined {
    if (!password) return t('validation.passwordRequired');
    if (password.length < 8) return t('validation.passwordTooShort');
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return t('validation.passwordWeakFormat');
    }
    return undefined;
  }

  function validateDateOfBirth(value: string): string | undefined {
    if (!value) return t('validation.dateOfBirthRequired');
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date >= new Date()) {
      return t('validation.dateOfBirthPast');
    }
    return undefined;
  }

  function validateIndividual(): FormErrors {
    const next: FormErrors = {};
    if (!individualForm.fullName.trim()) {
      next.fullName = t('validation.fullNameRequired');
    }
    const dobError = validateDateOfBirth(individualForm.dateOfBirth);
    if (dobError) next.dateOfBirth = dobError;
    const passwordError = validatePassword(individualForm.password);
    if (passwordError) next.password = passwordError;
    if (!individualForm.confirmPassword) {
      next.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (individualForm.password !== individualForm.confirmPassword) {
      next.confirmPassword = t('validation.passwordsMismatch');
    }
    return next;
  }

  function validateBusiness(): FormErrors {
    const next: FormErrors = {};
    if (!businessForm.contactName.trim()) {
      next.contactName = t('validation.contactNameRequired');
    }
    const dobError = validateDateOfBirth(businessForm.dateOfBirth);
    if (dobError) next.dateOfBirth = dobError;
    if (!businessForm.businessName.trim()) {
      next.businessName = t('validation.businessNameRequired');
    }
    if (
      businessForm.businessWebsite.trim() &&
      !/^https?:\/\/.+/i.test(businessForm.businessWebsite.trim())
    ) {
      next.businessWebsite = t('validation.businessWebsiteInvalid');
    }
    const passwordError = validatePassword(businessForm.password);
    if (passwordError) next.password = passwordError;
    if (!businessForm.confirmPassword) {
      next.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (businessForm.password !== businessForm.confirmPassword) {
      next.confirmPassword = t('validation.passwordsMismatch');
    }
    return next;
  }

  function clearFieldError(key: string) {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleOnboardingDetails() {
    const validationErrors =
      userType === 'individual' ? validateIndividual() : validateBusiness();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setDetailsLoading(true);

    let response;
    if (userType === 'business') {
      const formData = new FormData();
      formData.append('user_type', 'business');
      formData.append('name', businessForm.contactName.trim());
      formData.append('password', businessForm.password);
      formData.append('date_of_birth', businessForm.dateOfBirth);
      formData.append('business_name', businessForm.businessName.trim());
      if (businessForm.businessWebsite.trim()) {
        formData.append('business_website', businessForm.businessWebsite.trim());
      }
      response = await accountService.completeOnboarding(formData);
    } else {
      response = await accountService.completeOnboarding({
        user_type: 'individual',
        name: individualForm.fullName.trim(),
        password: individualForm.password,
        date_of_birth: individualForm.dateOfBirth,
      });
    }

    if (response.error || !response.data?.data) {
      toast.error(
        response.error?.message ?? t('auth.onboarding.saveFailed'),
      );
      setDetailsLoading(false);
      return;
    }

    updateUser(mapProfileToUserPartial(response.data.data));
    toast.success(t('auth.onboarding.saveSuccess'));
    setDetailsLoading(false);
    onComplete();
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
        {step === 'userType' ? (
          <View>
            <View className="flex-row items-center gap-2.5 mb-3.5">
              <View className="w-5 h-px bg-gray-400 dark:bg-gray-500" />
              <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500">
                {t('auth.onboarding.accountTypeKicker')}
              </Text>
            </View>

            <Text className="font-geist-semibold text-[28px] text-ink dark:text-gray-100 mb-2 leading-tight">
              {t('auth.onboarding.accountTypeTitle')}
            </Text>

            <Text className="font-geist text-[14.5px] text-gray-500 dark:text-gray-400 mb-8">
              {t('auth.onboarding.accountTypeSubtitle')}
            </Text>

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

            <LocalNotesButton
              label={t('common.continue')}
              onPress={() => setStep('details')}
              variant="dark"
              rightIcon={
                <ArrowRight
                  size={18}
                  color={colorScheme === 'dark' ? '#141413' : '#FFFFFF'}
                />
              }
            />
          </View>
        ) : null}

        {step === 'details' ? (
          <View>
            <Pressable
              onPress={() => setStep('userType')}
              className="flex-row items-center gap-1.5 mb-6 cursor-pointer"
            >
              <Text className="font-geist text-[13px] text-gray-400 dark:text-gray-500">
                ← {t('auth.onboarding.back')}
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-2.5 mb-3.5">
              <View className="w-5 h-px bg-gray-400 dark:bg-gray-500" />
              <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500">
                {t('auth.onboarding.detailsKicker')}
              </Text>
            </View>

            <Text className="font-geist-semibold text-[28px] text-ink dark:text-gray-100 mb-8 leading-tight">
              {userType === 'individual'
                ? t('auth.onboarding.individualDetailsTitle')
                : t('auth.onboarding.businessDetailsTitle')}
            </Text>

            <View className="gap-4">
              {userType === 'individual' ? (
                <>
                  <TextInput
                    label={t('auth.signUp.fullNameLabel')}
                    placeholder={t('auth.signUp.fullNamePlaceholder')}
                    value={individualForm.fullName}
                    onChangeText={(value) => {
                      setIndividualForm((prev) => ({ ...prev, fullName: value }));
                      clearFieldError('fullName');
                    }}
                    autoCapitalize="words"
                    error={errors.fullName}
                  />
                  <DateField
                    label={t('auth.onboarding.dateOfBirthLabel')}
                    placeholder={t('auth.onboarding.dateOfBirthPlaceholder')}
                    value={individualForm.dateOfBirth}
                    onChange={(value) => {
                      setIndividualForm((prev) => ({
                        ...prev,
                        dateOfBirth: value,
                      }));
                      clearFieldError('dateOfBirth');
                    }}
                    error={errors.dateOfBirth}
                  />
                  <TextInput
                    label={t('auth.signUp.passwordLabel')}
                    placeholder={t('auth.onboarding.passwordPlaceholder')}
                    value={individualForm.password}
                    onChangeText={(value) => {
                      setIndividualForm((prev) => ({ ...prev, password: value }));
                      clearFieldError('password');
                    }}
                    isPassword
                    autoComplete="new-password"
                    error={errors.password}
                  />
                  <TextInput
                    label={t('auth.signUp.confirmPasswordLabel')}
                    placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                    value={individualForm.confirmPassword}
                    onChangeText={(value) => {
                      setIndividualForm((prev) => ({
                        ...prev,
                        confirmPassword: value,
                      }));
                      clearFieldError('confirmPassword');
                    }}
                    isPassword
                    autoComplete="new-password"
                    error={errors.confirmPassword}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    label={t('auth.onboarding.contactNameLabel')}
                    placeholder={t('auth.onboarding.contactNamePlaceholder')}
                    value={businessForm.contactName}
                    onChangeText={(value) => {
                      setBusinessForm((prev) => ({ ...prev, contactName: value }));
                      clearFieldError('contactName');
                    }}
                    autoCapitalize="words"
                    error={errors.contactName}
                  />
                  <DateField
                    label={t('auth.onboarding.dateOfBirthLabel')}
                    placeholder={t('auth.onboarding.dateOfBirthPlaceholder')}
                    value={businessForm.dateOfBirth}
                    onChange={(value) => {
                      setBusinessForm((prev) => ({
                        ...prev,
                        dateOfBirth: value,
                      }));
                      clearFieldError('dateOfBirth');
                    }}
                    error={errors.dateOfBirth}
                  />

                  <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500 pt-2">
                    {t('auth.onboarding.businessDetailsSection')}
                  </Text>

                  <TextInput
                    label={t('auth.signUpBusiness.businessNameLabel')}
                    placeholder={t('auth.signUpBusiness.businessNamePlaceholder')}
                    value={businessForm.businessName}
                    onChangeText={(value) => {
                      setBusinessForm((prev) => ({
                        ...prev,
                        businessName: value,
                      }));
                      clearFieldError('businessName');
                    }}
                    error={errors.businessName}
                  />
                  <TextInput
                    label={t('auth.signUpBusiness.businessWebsiteLabel')}
                    placeholder={t(
                      'auth.signUpBusiness.businessWebsitePlaceholder',
                    )}
                    value={businessForm.businessWebsite}
                    onChangeText={(value) => {
                      setBusinessForm((prev) => ({
                        ...prev,
                        businessWebsite: value,
                      }));
                      clearFieldError('businessWebsite');
                    }}
                    autoCapitalize="none"
                    keyboardType="url"
                    error={errors.businessWebsite}
                  />

                  <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500 pt-2">
                    {t('auth.onboarding.securitySection')}
                  </Text>

                  <TextInput
                    label={t('auth.signUp.passwordLabel')}
                    placeholder={t('auth.onboarding.passwordPlaceholder')}
                    value={businessForm.password}
                    onChangeText={(value) => {
                      setBusinessForm((prev) => ({ ...prev, password: value }));
                      clearFieldError('password');
                    }}
                    isPassword
                    autoComplete="new-password"
                    error={errors.password}
                  />
                  <TextInput
                    label={t('auth.signUp.confirmPasswordLabel')}
                    placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                    value={businessForm.confirmPassword}
                    onChangeText={(value) => {
                      setBusinessForm((prev) => ({
                        ...prev,
                        confirmPassword: value,
                      }));
                      clearFieldError('confirmPassword');
                    }}
                    isPassword
                    autoComplete="new-password"
                    error={errors.confirmPassword}
                  />
                </>
              )}

              <LocalNotesButton
                label={
                  detailsLoading
                    ? t('common.pleaseWait')
                    : t('auth.onboarding.continueBusiness')
                }
                onPress={() => void handleOnboardingDetails()}
                variant="dark"
                disabled={detailsLoading}
                rightIcon={
                  !detailsLoading ? (
                    <ArrowRight
                      size={18}
                      color={colorScheme === 'dark' ? '#141413' : '#FFFFFF'}
                    />
                  ) : undefined
                }
              />
            </View>
          </View>
        ) : null}
    </KeyboardAwareScrollView>
  );
}
