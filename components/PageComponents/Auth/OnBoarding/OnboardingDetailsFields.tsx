import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { TextInput } from "../../../ui/TextInput";
import { DateField } from "../../../ui/DateField";
import { InputHint } from "../../../ui/InputHint";
import type {
  BusinessForm,
  FormErrors,
  IndividualForm,
  UserType,
} from "@/hooks/useOnboardingForm";

interface OnboardingDetailsFieldsProps {
  userType: UserType;
  individualForm: IndividualForm;
  businessForm: BusinessForm;
  errors: FormErrors;
  onIndividualChange: (next: IndividualForm) => void;
  onBusinessChange: (next: BusinessForm) => void;
  clearFieldError: (key: string) => void;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500 pt-2">
      {children}
    </Text>
  );
}

interface PasswordFieldsProps {
  password: string;
  confirmPassword: string;
  errors: FormErrors;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}

function PasswordFields({
  password,
  confirmPassword,
  errors,
  onPasswordChange,
  onConfirmPasswordChange,
}: PasswordFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <SectionLabel>{t("auth.onboarding.securitySection")}</SectionLabel>
      <TextInput
        label={t("auth.signUp.passwordLabel")}
        placeholder={t("auth.onboarding.passwordPlaceholder")}
        value={password}
        onChangeText={onPasswordChange}
        isPassword
        autoComplete="new-password"
        error={errors.password}
      />
      <InputHint hint={t("common.passwordHint")} />
      <TextInput
        label={t("auth.signUp.confirmPasswordLabel")}
        placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        isPassword
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
    </>
  );
}

export function OnboardingDetailsFields({
  userType,
  individualForm,
  businessForm,
  errors,
  onIndividualChange,
  onBusinessChange,
  clearFieldError,
}: OnboardingDetailsFieldsProps) {
  const { t } = useTranslation();

  function patchIndividual<K extends keyof IndividualForm>(
    key: K,
    value: IndividualForm[K],
  ) {
    onIndividualChange({ ...individualForm, [key]: value });
    clearFieldError(key);
  }

  function patchBusiness<K extends keyof BusinessForm>(
    key: K,
    value: BusinessForm[K],
  ) {
    onBusinessChange({ ...businessForm, [key]: value });
    clearFieldError(key);
  }

  if (userType === "individual") {
    return (
      <View className="gap-4">
        <TextInput
          label={t("auth.signUp.fullNameLabel")}
          placeholder={t("auth.signUp.fullNamePlaceholder")}
          value={individualForm.fullName}
          onChangeText={(value) => patchIndividual("fullName", value)}
          autoCapitalize="words"
          error={errors.fullName}
        />
        <DateField
          label={t("auth.onboarding.dateOfBirthLabel")}
          placeholder={t("auth.onboarding.dateOfBirthPlaceholder")}
          value={individualForm.dateOfBirth}
          onChange={(value) => patchIndividual("dateOfBirth", value)}
          error={errors.dateOfBirth}
        />
        <PasswordFields
          password={individualForm.password}
          confirmPassword={individualForm.confirmPassword}
          errors={errors}
          onPasswordChange={(value) => patchIndividual("password", value)}
          onConfirmPasswordChange={(value) =>
            patchIndividual("confirmPassword", value)
          }
        />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <TextInput
        label={t("auth.onboarding.contactNameLabel")}
        placeholder={t("auth.onboarding.contactNamePlaceholder")}
        value={businessForm.contactName}
        onChangeText={(value) => patchBusiness("contactName", value)}
        autoCapitalize="words"
        error={errors.contactName}
      />
      <DateField
        label={t("auth.onboarding.dateOfBirthLabel")}
        placeholder={t("auth.onboarding.dateOfBirthPlaceholder")}
        value={businessForm.dateOfBirth}
        onChange={(value) => patchBusiness("dateOfBirth", value)}
        error={errors.dateOfBirth}
      />

      <SectionLabel>{t("auth.onboarding.businessDetailsSection")}</SectionLabel>

      <TextInput
        label={t("auth.signUpBusiness.businessNameLabel")}
        placeholder={t("auth.signUpBusiness.businessNamePlaceholder")}
        value={businessForm.businessName}
        onChangeText={(value) => patchBusiness("businessName", value)}
        error={errors.businessName}
      />
      <TextInput
        label={t("auth.signUpBusiness.businessWebsiteLabel")}
        placeholder={t("auth.signUpBusiness.businessWebsitePlaceholder")}
        value={businessForm.businessWebsite}
        onChangeText={(value) => patchBusiness("businessWebsite", value)}
        autoCapitalize="none"
        keyboardType="url"
        error={errors.businessWebsite}
      />

      <PasswordFields
        password={businessForm.password}
        confirmPassword={businessForm.confirmPassword}
        errors={errors}
        onPasswordChange={(value) => patchBusiness("password", value)}
        onConfirmPasswordChange={(value) =>
          patchBusiness("confirmPassword", value)
        }
      />
    </View>
  );
}
