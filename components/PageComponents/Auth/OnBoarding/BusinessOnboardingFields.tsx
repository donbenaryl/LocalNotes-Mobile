import { Text } from "react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "@/components/ui/TextInput";
import { InputHint } from "@/components/ui/InputHint";
import type { FormErrors } from "@/hooks/useOnboardingForm";

export interface BusinessOnboardingValues {
  contactName: string;
  businessEmail: string;
  businessName: string;
  businessWebsite: string;
}

interface BusinessOnboardingFieldsProps {
  values: BusinessOnboardingValues;
  errors: FormErrors;
  onChange: (next: BusinessOnboardingValues) => void;
  clearFieldError: (key: string) => void;
  /** Profile-only fields (e.g. date of birth) rendered after contact/email. */
  afterContact?: ReactNode;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500 pt-2">
      {children}
    </Text>
  );
}

export function BusinessOnboardingFields({
  values,
  errors,
  onChange,
  clearFieldError,
  afterContact,
}: BusinessOnboardingFieldsProps) {
  const { t } = useTranslation();

  function patch<K extends keyof BusinessOnboardingValues>(
    key: K,
    value: BusinessOnboardingValues[K],
  ) {
    onChange({ ...values, [key]: value });
    clearFieldError(key);
  }

  return (
    <>
      <TextInput
        label={t("auth.onboarding.contactNameLabel")}
        placeholder={t("auth.onboarding.contactNamePlaceholder")}
        value={values.contactName}
        onChangeText={(value) => patch("contactName", value)}
        autoCapitalize="words"
        error={errors.contactName}
      />
      <TextInput
        label={t("auth.signUpBusiness.workEmailLabel")}
        placeholder={t("auth.signUpBusiness.workEmailPlaceholder")}
        value={values.businessEmail}
        onChangeText={(value) => patch("businessEmail", value)}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        error={errors.businessEmail}
      />
      <InputHint hint={t("auth.signUpBusiness.workEmailHint")} />
      {afterContact}

      <SectionLabel>{t("auth.onboarding.businessDetailsSection")}</SectionLabel>

      <TextInput
        label={t("auth.signUpBusiness.businessNameLabel")}
        placeholder={t("auth.signUpBusiness.businessNamePlaceholder")}
        value={values.businessName}
        onChangeText={(value) => patch("businessName", value)}
        error={errors.businessName}
      />
      <TextInput
        label={t("auth.signUpBusiness.businessWebsiteLabel")}
        placeholder={t("auth.signUpBusiness.businessWebsitePlaceholder")}
        value={values.businessWebsite}
        onChangeText={(value) => patch("businessWebsite", value)}
        autoCapitalize="none"
        keyboardType="url"
        error={errors.businessWebsite}
      />
    </>
  );
}
