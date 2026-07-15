import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { SocialAuthButton } from "../../ui/SocialAuthButton";

interface ContinueWithProps {
  promptText: string;
  linkText: string;
  onLinkPress: () => void;
  dividerText?: string;
  onSocialAuth?: (provider: "google" | "apple") => void;
  socialDisabled?: boolean;
  hideTerms?: boolean;
}

export function ContinueWith({
  promptText,
  linkText,
  onLinkPress,
  dividerText,
  onSocialAuth,
  socialDisabled = false,
  hideTerms = false,
}: ContinueWithProps) {
  const { t } = useTranslation();
  const router = useRouter();

  function handleSocialAuth(provider: "google" | "apple") {
    if (onSocialAuth) {
      onSocialAuth(provider);
      return;
    }
    Alert.alert(
      t("alerts.comingSoon"),
      provider === "google"
        ? t("alerts.comingSoonGoogle")
        : t("alerts.comingSoonApple"),
    );
  }

  return (
    <>
      {/* Continue With Section */}
      <View className="flex-row items-center px-6 mt-8 mb-4 gap-2">
        <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
          {dividerText ?? t("common.orSignInWith")}
        </Text>
        <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </View>

      <View className="flex flex-row px-6 mt-4 gap-3">
        <SocialAuthButton
          provider="google"
          onPress={() => handleSocialAuth("google")}
          disabled={socialDisabled}
        />
        <SocialAuthButton
          provider="apple"
          onPress={() => handleSocialAuth("apple")}
          disabled={socialDisabled}
        />
      </View>

      {/* No Account Section */}
      <View className="flex-row justify-center items-center mt-6 gap-1 mb-4">
        <Text className="font-geist text-gray-500 dark:text-gray-400">
          {promptText}
        </Text>
        <TouchableOpacity
          onPress={onLinkPress}
          hitSlop={8}
          className="cursor-pointer"
        >
          <Text className="font-geist-bold text-brand">{linkText}</Text>
        </TouchableOpacity>
      </View>

      {!hideTerms && (
        <View className="px-14">
          <Text className="font-geist text-center text-sm leading-5 text-gray-500 dark:text-gray-400">
            {t("auth.signIn.terms.prefix")}
            <Text
              className="font-geist text-ink underline dark:text-gray-100 cursor-pointer"
              onPress={() => router.push("/terms" as Href)}
            >
              {t("auth.signIn.terms.termsLink")}
            </Text>
            {t("auth.signIn.terms.separator")}
            <Text
              className="font-geist text-ink underline dark:text-gray-100 cursor-pointer"
              onPress={() => router.push("/privacy-policy" as Href)}
            >
              {t("auth.signIn.terms.privacyLink")}
            </Text>
            {t("auth.signIn.terms.andSeparator")}
            <Text
              className="font-geist text-ink underline dark:text-gray-100 cursor-pointer"
              onPress={() => router.push("/community-guidelines" as Href)}
            >
              {t("auth.signIn.terms.guidelinesLink")}
            </Text>
          </Text>
        </View>
      )}
    </>
  );
}
