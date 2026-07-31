import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import accountService from '@/http/account-api/account.services';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { mapProfileToUser } from '@/utils/mapProfileToUser';
import { isCommonPassword } from '@/utils/isCommonPassword';
import {
  isUsernameBlocking,
  type UsernameAvailabilityStatus,
} from '@/hooks/useUsernameAvailability';
import { getUsernameFormatError } from '@/utils/usernameValidation';

export type UserType = 'individual' | 'business';

export interface IndividualForm {
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

export interface BusinessForm {
  contactName: string;
  dateOfBirth: string;
  businessName: string;
  businessWebsite: string;
  password: string;
  confirmPassword: string;
}

export type FormErrors = Record<string, string>;

const INITIAL_INDIVIDUAL: IndividualForm = {
  firstName: '',
  lastName: '',
  displayName: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
};

const INITIAL_BUSINESS: BusinessForm = {
  contactName: '',
  dateOfBirth: '',
  businessName: '',
  businessWebsite: '',
  password: '',
  confirmPassword: '',
};

const NAME_MAX_LENGTH = 250;

export function useOnboardingForm() {
  const { t } = useTranslation();
  const updateUser = useAuthStore((s) => s.updateUser);

  const [userType, setUserType] = useState<UserType>('individual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameAvailabilityStatus>('idle');

  const [individualForm, setIndividualForm] =
    useState<IndividualForm>(INITIAL_INDIVIDUAL);
  const [businessForm, setBusinessForm] =
    useState<BusinessForm>(INITIAL_BUSINESS);

  function validatePassword(password: string): string | undefined {
    if (!password) return t('validation.passwordRequired');
    if (password.length < 8) return t('validation.passwordTooShort');
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      return t('validation.passwordNeedsMixedCase');
    }
    if (!/[!/@.]/.test(password)) {
      return t('validation.passwordNeedsSpecialChar');
    }
    if (isCommonPassword(password)) {
      return t('validation.passwordTooCommon');
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

  function validateUsernameValue(value: string): string | undefined {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return t('validation.usernameRequired');
    const formatError = getUsernameFormatError(trimmed);
    if (formatError === 'tooShort') return t('validation.usernameTooShort');
    if (formatError === 'handleTooLong') return t('validation.usernameTooLong');
    if (formatError === 'emailTooLong') {
      return t('validation.usernameEmailTooLong');
    }
    if (formatError === 'invalidFormat') {
      return t('validation.usernameInvalidFormat');
    }
    if (isUsernameBlocking(usernameStatus) || usernameStatus !== 'available') {
      return t('validation.usernameUnavailable');
    }
    return undefined;
  }

  function validateIndividual(): FormErrors {
    const next: FormErrors = {};
    if (!individualForm.displayName.trim()) {
      next.displayName = t('validation.displayNameRequired');
    }
    if (individualForm.firstName.length > NAME_MAX_LENGTH) {
      next.firstName = t('validation.nameTooLong');
    }
    if (individualForm.lastName.length > NAME_MAX_LENGTH) {
      next.lastName = t('validation.nameTooLong');
    }
    const dobError = validateDateOfBirth(individualForm.dateOfBirth);
    if (dobError) next.dateOfBirth = dobError;
    const usernameError = validateUsernameValue(username);
    if (usernameError) next.username = usernameError;
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
    const usernameError = validateUsernameValue(username);
    if (usernameError) next.username = usernameError;
    const passwordError = validatePassword(businessForm.password);
    if (passwordError) next.password = passwordError;
    if (!businessForm.confirmPassword) {
      next.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (businessForm.password !== businessForm.confirmPassword) {
      next.confirmPassword = t('validation.passwordsMismatch');
    }
    return next;
  }

  function validate(): boolean {
    const validationErrors =
      userType === 'individual' ? validateIndividual() : validateBusiness();
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
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

  function setUsernameValue(value: string) {
    setUsername(value);
    clearFieldError('username');
  }

  async function submit(): Promise<boolean> {
    if (!validate()) return false;

    setIsSubmitting(true);
    const normalizedUsername = username.trim().toLowerCase();

    let response;
    if (userType === 'business') {
      const formData = new FormData();
      formData.append('user_type', 'business');
      formData.append('name', businessForm.contactName.trim());
      formData.append('password', businessForm.password);
      formData.append('date_of_birth', businessForm.dateOfBirth);
      formData.append('business_name', businessForm.businessName.trim());
      formData.append('username', normalizedUsername);
      if (businessForm.businessWebsite.trim()) {
        formData.append(
          'business_website',
          businessForm.businessWebsite.trim(),
        );
      }
      response = await accountService.completeOnboarding(formData);
    } else {
      const firstName = individualForm.firstName.trim();
      const lastName = individualForm.lastName.trim();
      response = await accountService.completeOnboarding({
        user_type: 'individual',
        name: individualForm.displayName.trim(),
        password: individualForm.password,
        date_of_birth: individualForm.dateOfBirth,
        username: normalizedUsername,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
      });
    }

    if (response.error || !response.data?.data) {
      toast.error(
        response.error?.message ?? t('auth.onboarding.saveFailed'),
      );
      setIsSubmitting(false);
      return false;
    }

    updateUser(mapProfileToUser(response.data.data));
    toast.success(t('auth.onboarding.saveSuccess'));
    setIsSubmitting(false);
    return true;
  }

  return {
    userType,
    setUserType,
    individualForm,
    setIndividualForm,
    businessForm,
    setBusinessForm,
    username,
    setUsername: setUsernameValue,
    usernameStatus,
    setUsernameStatus,
    errors,
    clearFieldError,
    validate,
    submit,
    isSubmitting,
  };
}
