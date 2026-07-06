import { Alert, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "../../../ui/KeyboardAwareScrollView";
import { useState } from "react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { TextInput } from "../../../ui/TextInput";
import { PageTitleHeading } from "@/components/ui/PageTitleHeading";
import { LocalNotesButton } from "../../../ui/LocalNotesButton";
import { ArrowRight } from "lucide-react-native";
import { ContinueWith } from "../ContinueWith";
import authService from "../../../../http/auth-api/auth.service";
import type { signInDAO } from "../../../../http/auth-api/types";
import { toast } from "../../../ui/Toast";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { FaceSignIn } from "./FaceSignIn";
import { mapSignInDaoToUser } from "../../../../utils/mapProfileToUser";
import { getPostAuthRoute } from "../../../../utils/personality";

interface FormState {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function useValidate() {
  const { t } = useTranslation();
  return function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.email.trim()) {
      errors.email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = t("validation.emailInvalid");
    }
    if (!form.password) {
      errors.password = t("validation.passwordRequired");
    }
    return errors;
  };
}

export function MainSignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const setAuth = useAuthStore((s) => s.setAuth);
  const validate = useValidate();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  function setField(key: keyof FormState) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };
  }

  const mutation = useMutation({
    mutationFn: async (): Promise<signInDAO> => {
      const response = await authService.SignIn({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (response.error || !response.data?.data) {
        throw new Error(response.error?.message ?? t("alerts.signInFailed"));
      }

      return response.data.data;
    },
    onSuccess: async (dao) => {
      await setAuth(mapSignInDaoToUser(dao), dao.token, dao.refresh_token);
      router.replace(getPostAuthRoute(dao.personality_name) as Href);
    },
    onError: (error: Error) => {
      toast.error(error.message, { title: t("alerts.signInFailed") });
    },
  });

  function handleSignIn() {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    mutation.mutate();
  }

  function handleSocialAuth(provider: "google" | "apple") {
    Alert.alert(
      t("alerts.comingSoon"),
      provider === "google"
        ? t("alerts.comingSoonGoogle")
        : t("alerts.comingSoonApple"),
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
            title={t("auth.signIn.title")}
            subtitle={t("auth.signIn.subtitle")}
            description={t("auth.signIn.description")}
          />
        </View>

        <View className="px-6 gap-4">
          <TextInput
            label={t("auth.signIn.emailLabel")}
            placeholder={t("auth.signIn.emailPlaceholder")}
            value={form.email}
            onChangeText={setField("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <TextInput
            label={t("auth.signIn.passwordLabel")}
            placeholder={t("auth.signIn.passwordPlaceholder")}
            value={form.password}
            onChangeText={setField("password")}
            isPassword
            autoComplete="current-password"
            error={errors.password}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            hitSlop={8}
            className="cursor-pointer"
          >
            <Text className="font-geist-medium text-ink dark:text-gray-100">
              {t("auth.signIn.forgotPassword")}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 mt-8">
          <LocalNotesButton
            label={
              mutation.isPending
                ? t("auth.signIn.signingIn")
                : t("auth.signIn.button")
            }
            onPress={handleSignIn}
            variant="dark"
            rightIcon={
              <ArrowRight
                size={12}
                color={colorScheme === "dark" ? "#191B1C" : "#FFFFFF"}
              />
            }
          />
        </View>

        <ContinueWith
          promptText={t("auth.signIn.noAccount")}
          linkText={t("auth.signIn.createAccount")}
          onLinkPress={() => router.replace("/sign-up")}
          onSocialAuth={handleSocialAuth}
        />

        {/* <View className="mt-6">
          <FaceSignIn />
        </View> */}
    </KeyboardAwareScrollView>
  );
}
