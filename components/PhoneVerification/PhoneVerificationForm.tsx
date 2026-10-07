import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { CountryCode } from "libphonenumber-js";
import { useTranslation } from "react-i18next";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { OtpInput } from "@/components/ui/OtpInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import accountService from "@/http/account-api/account.services";
import type { profileItemDAO } from "@/http/account-api/types";
import { DEFAULT_COUNTRY } from "@/utils/countries";
import {
  formatCooldown,
  formatPhoneForDisplay,
  getRetryAfterSeconds,
  validateNationalNumber,
} from "@/utils/phone";

const OTP_LENGTH = 6;
const DEFAULT_RESEND_SECONDS = 60;

interface PhoneVerificationFormProps {
  onVerified?: (profile: profileItemDAO) => void;
  /** Smaller layout for embedding inside another sheet. */
  compact?: boolean;
}

function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

export function PhoneVerificationForm({ onVerified, compact = false }: PhoneVerificationFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [rawPhone, setRawPhone] = useState("");
  const [e164, setE164] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useCountdown();
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);

  const rateLimitedMessage = (seconds: number) =>
    t("phoneVerification.rateLimited", { duration: formatCooldown(seconds, t) });

  const sendCode = async (target: string) => {
    if (isSending || cooldown > 0) return;
    setIsSending(true);
    setError(null);
    try {
      const response = await accountService.sendPhoneCode({
        phone_number: target,
        region: country,
      });
      if (response.error) {
        const retryAfter = getRetryAfterSeconds(response.error);
        if (retryAfter) setCooldown(retryAfter);
        setError(
          retryAfter
            ? rateLimitedMessage(retryAfter)
            : response.error.message || t("phoneVerification.sendFailed"),
        );
        return;
      }
      setE164(response.data?.data?.phone_number ?? target);
      setCode("");
      setStep("code");
      setCooldown(response.data?.data?.resend_after ?? DEFAULT_RESEND_SECONDS);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitPhone = () => {
    const normalized = validateNationalNumber(rawPhone, country);
    if (!normalized) {
      setError(t("phoneVerification.invalidPhone"));
      return;
    }
    void sendCode(normalized);
  };

  const verify = async (value: string) => {
    if (!e164 || isVerifying || value.length !== OTP_LENGTH) return;
    setIsVerifying(true);
    setError(null);
    try {
      const response = await accountService.verifyPhoneCode({
        phone_number: e164,
        code: value,
      });
      const profile = response.data?.data;
      if (response.error || !profile) {
        const retryAfter = getRetryAfterSeconds(response.error);
        setError(
          retryAfter
            ? rateLimitedMessage(retryAfter)
            : response.error?.message || t("phoneVerification.verifyFailed"),
        );
        setCode("");
        return;
      }
      queryClient.setQueryData(["profile"], profile);
      void queryClient.invalidateQueries({ queryKey: ["contactUsers"] });
      onVerified?.(profile);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.length === OTP_LENGTH) void verify(value);
  };

  if (step === "code") {
    return (
      <View className="gap-4">
        <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
          {t("phoneVerification.codeSentTo", { phone: formatPhoneForDisplay(e164) })}
        </Text>
        <OtpInput value={code} onChange={handleCodeChange} />
        {error ? <Text className="font-geist text-xs text-error">{error}</Text> : null}
        <LocalNotesButton
          label={t("phoneVerification.verify")}
          onPress={() => void verify(code)}
          disabled={code.length !== OTP_LENGTH}
          loading={isVerifying}
          variant="brand"
          size={compact ? "sm" : "md"}
        />
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              setStep("phone");
              setError(null);
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text className="font-geist-medium text-sm text-gray-500 dark:text-gray-400">
              {t("phoneVerification.changeNumber")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => e164 && void sendCode(e164)}
            disabled={cooldown > 0 || isSending}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text
              className={
                cooldown > 0
                  ? "font-geist-medium text-sm text-gray-400 dark:text-gray-500"
                  : "font-geist-medium text-sm text-brand"
              }
            >
              {cooldown > 0
                ? t("phoneVerification.resendIn", { duration: formatCooldown(cooldown, t) })
                : t("phoneVerification.resend")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <PhoneInput
        label={compact ? undefined : t("phoneVerification.phoneLabel")}
        placeholder={t("phoneVerification.phonePlaceholder")}
        value={rawPhone}
        country={country}
        onChangeText={(value) => {
          setRawPhone(value);
          if (error) setError(null);
        }}
        onChangeCountry={(next) => {
          setCountry(next);
          setRawPhone("");
          if (error) setError(null);
        }}
        onSubmitEditing={handleSubmitPhone}
        error={error ?? undefined}
      />
      <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
        {t("phoneVerification.smsDisclaimer")}
      </Text>
      <LocalNotesButton
        label={
          cooldown > 0
            ? t("phoneVerification.resendIn", { duration: formatCooldown(cooldown, t) })
            : t("phoneVerification.sendCode")
        }
        onPress={handleSubmitPhone}
        disabled={rawPhone.trim().length === 0 || cooldown > 0}
        loading={isSending}
        variant="brand"
        size={compact ? "sm" : "md"}
      />
    </View>
  );
}
