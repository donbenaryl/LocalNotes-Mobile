import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/TextInput";
import { InputHint } from "@/components/ui/InputHint";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { BottomWrapper } from "@/components/ui/BottomWrapper";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { PageLoader } from "@/components/ui/PageLoader";
import { DropDown } from "@/components/ui/DropDown";
import {
  BusinessProfileFields,
  type BusinessProfileFormValues,
} from "@/components/PageComponents/Profile/BusinessProfileFields";
import { AddBranchModal } from "@/components/PageComponents/Profile/AddBranchModal";
import { EditBranchHoursModal } from "@/components/PageComponents/Profile/EditBranchHoursModal";
import accountService from "@/http/account-api/account.services";
import businessService from "@/http/business-api/business.service";
import { toast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { syncSessionFromProfile } from "@/services/authBootstrap";
import { isBusinessAccountType } from "@/utils/businessAccount";
import { isCommonPassword } from "@/utils/isCommonPassword";
import {
  openingHoursForApi,
  validateOpeningHours,
} from "@/utils/openingHours";
import type { FormErrors } from "@/hooks/useOnboardingForm";

const EMPTY_BUSINESS_FORM: BusinessProfileFormValues = {
  businessName: "",
  businessType: "",
  businessBio: "",
  contactEmail: "",
  phoneNumber: "",
  businessWebsite: "",
  logoUrl: null,
  logoFiles: [],
  logoDeleted: false,
  branches: [],
};

export default function ConvertToBusiness() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const authAccountType = useAuthStore((s) => s.accountType);

  const [contactName, setContactName] = useState("");
  const [businessForm, setBusinessForm] =
    useState<BusinessProfileFormValues>(EMPTY_BUSINESS_FORM);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [seeded, setSeeded] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [addBranchVisible, setAddBranchVisible] = useState(false);
  const [editingHoursBranchId, setEditingHoursBranchId] = useState<
    string | null
  >(null);

  const addBranchIconColor = colorScheme === "dark" ? "#F3F4F6" : "#191B1C";

  const { data: profile, isPending } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await accountService.fetchUser();
      return res.data?.data ?? null;
    },
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ["business-types"],
    queryFn: async () => {
      const res = await businessService.fetchBusinessTypes();
      return res.data?.data ?? [];
    },
  });

  const businessTypeOptions = useMemo(
    () => businessTypes.map((item) => ({ value: item.name, label: item.name })),
    [businessTypes],
  );

  const accountType = profile?.account_type ?? authAccountType ?? undefined;
  const isAddAnother = isBusinessAccountType(accountType);

  useEffect(() => {
    if (!profile || seeded) return;
    setContactName(profile.name?.trim() || "");
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

  const canSubmit = useMemo(() => {
    if (!contactName.trim()) return false;
    if (!businessForm.businessName.trim()) return false;
    const emailTrimmed = businessForm.contactEmail.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return false;
    }
    if (!businessForm.phoneNumber.trim()) return false;
    const websiteTrimmed = businessForm.businessWebsite.trim();
    if (websiteTrimmed && !/^https?:\/\/.+/i.test(websiteTrimmed)) {
      return false;
    }
    for (const branch of businessForm.branches) {
      if (validateOpeningHours(branch.openingHours)) return false;
    }
    if (showPassword) {
      if (validatePasswordValue(password)) return false;
      if (!confirmPassword || password !== confirmPassword) return false;
    }
    return true;
  }, [
    contactName,
    businessForm,
    showPassword,
    password,
    confirmPassword,
    t,
  ]);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!contactName.trim()) {
      next.contactName = t("validation.contactNameRequired");
    }
    if (!businessForm.businessName.trim()) {
      next.businessName = t("editProfile.business.nameRequired");
    }
    const emailTrimmed = businessForm.contactEmail.trim();
    if (!emailTrimmed) {
      next.businessEmail = t("validation.workEmailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      next.businessEmail = t("validation.emailInvalid");
    }
    if (!businessForm.phoneNumber.trim()) {
      next.phoneNumber = t("editProfile.business.phoneRequired");
    }
    if (
      businessForm.businessWebsite.trim() &&
      !/^https?:\/\/.+/i.test(businessForm.businessWebsite.trim())
    ) {
      next.businessWebsite = t("editProfile.business.websiteInvalid");
    }
    for (const branch of businessForm.branches) {
      const hoursErrorKey = validateOpeningHours(branch.openingHours);
      if (hoursErrorKey) {
        next.openingHours = t(`editProfile.business.${hoursErrorKey}`);
        toast.error(t(`editProfile.business.${hoursErrorKey}`));
        break;
      }
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
      formData.append("name", contactName.trim());
      formData.append("business_name", businessForm.businessName.trim());
      formData.append("business_email", businessForm.contactEmail.trim());
      if (businessForm.businessType.trim()) {
        formData.append("business_type", businessForm.businessType.trim());
      }
      if (businessForm.businessBio.trim()) {
        formData.append("business_bio", businessForm.businessBio.trim());
      }
      if (businessForm.phoneNumber.trim()) {
        formData.append("business_phone", businessForm.phoneNumber.trim());
      }
      if (businessForm.businessWebsite.trim()) {
        formData.append(
          "business_website",
          businessForm.businessWebsite.trim(),
        );
      }
      if (businessForm.logoFiles[0]) {
        formData.append("business_logo", businessForm.logoFiles[0].file as never);
      }
      businessForm.branches.forEach((branch, index) => {
        const loc = branch.location;
        formData.append(`business_locations[${index}][name]`, branch.name);
        formData.append(`business_locations[${index}][city]`, loc.city);
        formData.append(
          `business_locations[${index}][country]`,
          loc.country,
        );
        if (loc.region) {
          formData.append(`business_locations[${index}][region]`, loc.region);
        }
        if (loc.street_address) {
          formData.append(
            `business_locations[${index}][street_address]`,
            loc.street_address,
          );
        }
        if (loc.postal_code) {
          formData.append(
            `business_locations[${index}][postal_code]`,
            loc.postal_code,
          );
        }
        if (loc.latitude != null) {
          formData.append(
            `business_locations[${index}][latitude]`,
            String(loc.latitude),
          );
        }
        if (loc.longitude != null) {
          formData.append(
            `business_locations[${index}][longitude]`,
            String(loc.longitude),
          );
        }
        formData.append(
          `business_locations[${index}][opening_hours]`,
          JSON.stringify(openingHoursForApi(branch.openingHours)),
        );
      });
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
      await syncSessionFromProfile(data, queryClient);
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
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="mt-4 mb-2 px-6 font-geist text-sm text-gray-500 dark:text-gray-400">
          {isAddAnother
            ? t("convertToBusiness.addHelper")
            : t("convertToBusiness.helper")}
        </Text>

        <View className="px-6 gap-4 bg-white dark:bg-gray-900 py-4">
          <TextInput
            label={t("auth.onboarding.contactNameLabel")}
            placeholder={t("auth.onboarding.contactNamePlaceholder")}
            value={contactName}
            onChangeText={(value) => {
              setContactName(value);
              clearFieldError("contactName");
            }}
            autoCapitalize="words"
            error={errors.contactName}
            editable={!isSubmitting}
          />
        </View>

        <BusinessProfileFields
          values={businessForm}
          onChange={(next) => {
            setBusinessForm(next);
            clearFieldError("businessName");
            clearFieldError("businessEmail");
            clearFieldError("phoneNumber");
            clearFieldError("businessWebsite");
            clearFieldError("openingHours");
          }}
          editable={!isSubmitting}
          onPressBusinessType={() => setTypePickerOpen(true)}
          onAddBranch={() => setAddBranchVisible(true)}
          onRemoveBranch={(branchId) => {
            setBusinessForm((prev) => ({
              ...prev,
              branches: prev.branches.filter((b) => b.id !== branchId),
            }));
          }}
          onEditBranchHours={(branchId) => setEditingHoursBranchId(branchId)}
          addBranchIconColor={addBranchIconColor}
          contactEmailHint={t("auth.signUpBusiness.workEmailHint")}
        />

        {errors.businessName ||
        errors.businessEmail ||
        errors.phoneNumber ||
        errors.businessWebsite ? (
          <View className="px-6 gap-1 pb-2">
            {errors.businessName ? (
              <Text className="font-geist text-xs text-error">
                {errors.businessName}
              </Text>
            ) : null}
            {errors.businessEmail ? (
              <Text className="font-geist text-xs text-error">
                {errors.businessEmail}
              </Text>
            ) : null}
            {errors.phoneNumber ? (
              <Text className="font-geist text-xs text-error">
                {errors.phoneNumber}
              </Text>
            ) : null}
            {errors.businessWebsite ? (
              <Text className="font-geist text-xs text-error">
                {errors.businessWebsite}
              </Text>
            ) : null}
          </View>
        ) : null}

        {showPassword ? (
          <View className="px-6 gap-4 pb-4">
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
          </View>
        ) : null}
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
            disabled={isSubmitting || !canSubmit}
            loading={isSubmitting}
          />
        </BottomWrapper>
      </KeyboardStickyView>

      <DropDown
        visible={typePickerOpen}
        options={businessTypeOptions}
        selected={businessForm.businessType}
        onApply={(value) =>
          setBusinessForm((prev) => ({ ...prev, businessType: value }))
        }
        onClose={() => setTypePickerOpen(false)}
        isSearchable
        searchPlaceholder={t("common.search")}
      />

      <AddBranchModal
        visible={addBranchVisible}
        onClose={() => setAddBranchVisible(false)}
        onSave={async (branchName, branchLocation, openingHours) => {
          setBusinessForm((prev) => ({
            ...prev,
            branches: [
              ...prev.branches,
              {
                id: `draft-${Date.now()}-${prev.branches.length}`,
                name: branchName,
                location: branchLocation,
                openingHours,
              },
            ],
          }));
          setAddBranchVisible(false);
        }}
      />
      <EditBranchHoursModal
        visible={editingHoursBranchId !== null}
        branchName={
          businessForm.branches.find((b) => b.id === editingHoursBranchId)
            ?.name
        }
        initialHours={
          businessForm.branches.find((b) => b.id === editingHoursBranchId)
            ?.openingHours
        }
        onClose={() => setEditingHoursBranchId(null)}
        onSave={async (hours) => {
          if (!editingHoursBranchId) return;
          setBusinessForm((prev) => ({
            ...prev,
            branches: prev.branches.map((branch) =>
              branch.id === editingHoursBranchId
                ? { ...branch, openingHours: hours }
                : branch,
            ),
          }));
          setEditingHoursBranchId(null);
        }}
      />
    </SafeAreaView>
  );
}
