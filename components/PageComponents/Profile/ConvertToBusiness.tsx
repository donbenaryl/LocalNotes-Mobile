import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/TextInput";
import { InputHint } from "@/components/ui/InputHint";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { BottomWrapper } from "@/components/ui/BottomWrapper";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  BusinessOnboardingFields,
  type BusinessOnboardingValues,
} from "@/components/PageComponents/Auth/OnBoarding/BusinessOnboardingFields";
import accountService from "@/http/account-api/account.services";
import { toast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBusinessStore } from "@/stores/useBusinessStore";
import { mapProfileToUser } from "@/utils/mapProfileToUser";
import { isBusinessAccountType } from "@/utils/businessAccount";
import { isCommonPassword } from "@/utils/isCommonPassword";
import { isWorkEmail } from "@/utils/isWorkEmail";
import type { FormErrors } from "@/hooks/useOnboardingForm";

const INITIAL_VALUES: BusinessOnboardingValues = {
  contactName: "",
  businessEmail: "",
  businessName: "",
  businessWebsite: "",
};

export default function ConvertToBusiness() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const authAccountType = useAuthStore((s) => s.accountType);
  const refreshBusinessInfo = useBusinessStore((s) => s.refreshBusinessInfo);
  const loadOwnedBusinesses = useBusinessStore((s) => s.loadOwnedBusinesses);

  const [values, setValues] = useState<BusinessOnboardingValues>(INITIAL_VALUES);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [seeded, setSeeded] = useState(false);

  const { data: profile, isPending } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await accountService.fetchUser();
      return res.data?.data ?? null;
    },
  });

  const accountType = profile?.account_type ?? authAccountType ?? undefined;
  const isAddAnother = isBusinessAccountType(accountType);

  useEffect(() => {
    if (!profile || seeded) return;
    setValues((prev) => ({
      ...prev,
      contactName: profile.name?.trim() || prev.contactName,
    }));
    setSeeded(true);
  }, [profile, seeded]);

  function clearFieldError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validatePasswordValue(value: string): string | undefined {
    if (!value) return t("validation.passwordRequired");
    if (value.length < 8) return t("validation.passwordTooShort");
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) {
      return t("validation.passwordNeedsMixedCase");
    }
    if (!/[!/@.]/.test(value)) {
      return t("validation.passwordNeedsSpecialChar");
    }
    if (isCommonPassword(value)) {
      return t("validation.passwordTooCommon");
    }
    return undefined;
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!values.contactName.trim()) {
      next.contactName = t("validation.contactNameRequired");
    }
    const emailTrimmed = values.businessEmail.trim();
    if (!emailTrimmed) {
      next.businessEmail = t("validation.workEmailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      next.businessEmail = t("validation.emailInvalid");
    } else if (!isWorkEmail(emailTrimmed)) {
      next.businessEmail = t("auth.signUpBusiness.workEmailInvalid");
    }
    if (!values.businessName.trim()) {
      next.businessName = t("validation.businessNameRequired");
    }
    if (
      values.businessWebsite.trim() &&
      !/^https?:\/\/.+/i.test(values.businessWebsite.trim())
    ) {
      next.businessWebsite = t("validation.businessWebsiteInvalid");
    }
    if (showPassword) {
      const passwordError = validatePasswordValue(password);
      if (passwordError) next.password = passwordError;
      if (!confirmPassword) {
        next.confirmPassword = t("validation.confirmPasswordRequired");
      } else if (password !== confirmPassword) {
        next.confirmPassword = t("validation.passwordsMismatch");
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (!validate()) {
        throw new Error("validation");
      }
      const formData = new FormData();
      formData.append("user_type", "business");
      formData.append("name", values.contactName.trim());
      formData.append("business_name", values.businessName.trim());
      formData.append("business_email", values.businessEmail.trim());
      if (values.businessWebsite.trim()) {
        formData.append("business_website", values.businessWebsite.trim());
      }
      if (showPassword && password) {
        formData.append("password", password);
      }
      const response = await accountService.completeOnboarding(formData);
      if (response.error || !response.data?.data) {
        const message =
          response.error?.message ??
          (isAddAnother
            ? t("convertToBusiness.addFailed")
            : t("convertToBusiness.saveFailed"));
        const passwordRequired =
          /password/i.test(message) &&
          (/required/i.test(message) || /no password/i.test(message));
        if (passwordRequired && !showPassword) {
          setShowPassword(true);
        }
        throw new Error(message);
      }
      return response.data.data;
    },
    onSuccess: async (data) => {
      updateUser(mapProfileToUser(data));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["business-info"] });
      await refreshBusinessInfo();
      await loadOwnedBusinesses();
      toast.success(
        isAddAnother
          ? t("convertToBusiness.addSuccess")
          : t("convertToBusiness.saveSuccess"),
      );
      router.back();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "validation") return;
      toast.error(
        err instanceof Error
          ? err.message
          : isAddAnother
            ? t("convertToBusiness.addFailed")
            : t("convertToBusiness.saveFailed"),
      );
    },
  });

  if (isPending) return <PageLoader />;

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-page dark:bg-gray-900"
    >
      <PageHeader
        title={
          isAddAnother
            ? t("convertToBusiness.addTitle")
            : t("convertToBusiness.title")
        }
        onBack={() => router.back()}
      />
      <KeyboardAwareScrollView
        className="flex-1"
        bottomOffset={120}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
      >
        <Text className="mt-4 mb-6 font-geist text-sm text-gray-500 dark:text-gray-400">
          {isAddAnother
            ? t("convertToBusiness.addHelper")
            : t("convertToBusiness.helper")}
        </Text>
        <View className="gap-4">
          <BusinessOnboardingFields
            values={values}
            errors={errors}
            onChange={setValues}
            clearFieldError={clearFieldError}
          />
          {showPassword ? (
            <>
              <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500 pt-2">
                {t("auth.onboarding.securitySection")}
              </Text>
              <TextInput
                label={t("auth.signUp.passwordLabel")}
                placeholder={t("auth.onboarding.passwordPlaceholder")}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  clearFieldError("password");
                }}
                isPassword
                autoComplete="new-password"
                error={errors.password}
              />
              <InputHint hint={t("common.passwordHint")} />
              <TextInput
                label={t("auth.signUp.confirmPasswordLabel")}
                placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  clearFieldError("confirmPassword");
                }}
                isPassword
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
            </>
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <BottomWrapper style={{ position: "relative" }}>
          <LocalNotesButton
            label={
              isSubmitting
                ? isAddAnother
                  ? t("convertToBusiness.adding")
                  : t("convertToBusiness.submitting")
                : isAddAnother
                  ? t("convertToBusiness.addSubmit")
                  : t("convertToBusiness.submit")
            }
            onPress={() => submit()}
            variant="dark"
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </BottomWrapper>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
