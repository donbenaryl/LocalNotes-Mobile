import { View } from "react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "../../../ui/TextInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { InputHint } from "../../../ui/InputHint";
import { BusinessOnboardingFields } from "./BusinessOnboardingFields";
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
  /** Rendered after username slot for email (email field) or custom content. */
  beforePassword?: ReactNode;
  /** When true, skip password fields (social completion). */
  hidePassword?: boolean;
}

interface PasswordFieldProps {
  password: string;
  errors: FormErrors;
  onPasswordChange: (value: string) => void;
}

function PasswordField({
  password,
  errors,
  onPasswordChange,
}: PasswordFieldProps) {
  const { t } = useTranslation();

  return (
    <>
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
  beforePassword,
  hidePassword = false,
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
        {beforePassword}
        {!hidePassword ? (
          <PasswordField
            password={individualForm.password}
            errors={errors}
            onPasswordChange={(value) => patchIndividual("password", value)}
          />
        ) : null}
        <DatePicker
          label={t("auth.onboarding.dateOfBirthLabel")}
          placeholder={t("auth.onboarding.dateOfBirthPlaceholder")}
          value={individualForm.dateOfBirth}
          onChange={(value) => patchIndividual("dateOfBirth", value)}
          error={errors.dateOfBirth}
        />
        <InputHint hint={t("auth.signUp.dateOfBirthHint")} />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <BusinessOnboardingFields
        values={{
          contactName: businessForm.contactName,
          businessEmail: businessForm.businessEmail,
          businessName: businessForm.businessName,
          businessWebsite: businessForm.businessWebsite,
        }}
        errors={errors}
        onChange={(next) =>
          onBusinessChange({
            ...businessForm,
            contactName: next.contactName,
            businessEmail: next.businessEmail,
            businessName: next.businessName,
            businessWebsite: next.businessWebsite,
          })
        }
        clearFieldError={clearFieldError}
        afterContact={
          <>
            <DatePicker
              label={t("auth.onboarding.dateOfBirthLabel")}
              placeholder={t("auth.onboarding.dateOfBirthPlaceholder")}
              value={businessForm.dateOfBirth}
              onChange={(value) => patchBusiness("dateOfBirth", value)}
              error={errors.dateOfBirth}
            />
            <InputHint hint={t("auth.signUp.dateOfBirthHint")} />
          </>
        }
      />

      {beforePassword}
      {!hidePassword ? (
        <PasswordField
          password={businessForm.password}
          errors={errors}
          onPasswordChange={(value) => patchBusiness("password", value)}
        />
      ) : null}
    </View>
  );
}
