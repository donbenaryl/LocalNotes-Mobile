import { useMemo, useState, type ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Mail,
  Phone,
  X,
} from "lucide-react-native";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextInput } from "@/components/ui/TextInput";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { BottomWrapper } from "@/components/ui/BottomWrapper";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { LocationInput } from "@/components/ui/LocationInput";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { OtpInput } from "@/components/ui/OtpInput";
import { DropDown } from "@/components/ui/DropDown";
import businessService from "@/http/business-api/business.service";
import type { RNFile } from "@/http/types";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { WhiteBox } from "@/components/ui/WhiteBox";

const CONSUMER_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com"];
const MAX_PROOF_BYTES = 10 * 1024 * 1024;

type FormStep = "paths" | "email" | "phone" | "document";

function isWorkEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return false;
  return !CONSUMER_EMAIL_DOMAINS.some((domain) =>
    normalized.endsWith(`@${domain}`),
  );
}

function guessMimeType(name: string, fallback?: string | null): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback || "application/octet-stream";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (!local) return `***@${domain}`;
  return `${local[0]}***@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `***-***-${digits.slice(-4)}`;
}

function formatNowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseProposedLocationParam(
  raw?: string | string[],
): GeoLocation | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<GeoLocation>;
    if (
      typeof parsed.city !== "string" ||
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number"
    ) {
      return null;
    }
    return {
      street_address: parsed.street_address ?? "",
      postal_code: parsed.postal_code ?? "",
      city: parsed.city,
      region: typeof parsed.region === "string" ? parsed.region : "",
      country: typeof parsed.country === "string" ? parsed.country : "",
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };
  } catch {
    return null;
  }
}

export default function ClaimBusinessForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    source?: string;
    businessId?: string;
    listItemId?: string;
    targetName?: string;
    hasExistingBusiness?: string;
    proposedName?: string;
    businessType?: string;
    locationLabel?: string;
    logo?: string;
    contactEmail?: string;
    phoneNumber?: string;
    proposedLocation?: string;
  }>();

  const isPickClaim = params.source === "pick";
  const needsProposedFields =
    isPickClaim && params.hasExistingBusiness !== "true";
  const hasBusinessTarget = Boolean(
    params.businessId || (isPickClaim && params.hasExistingBusiness === "true"),
  );
  const pickLocation = useMemo(
    () => parseProposedLocationParam(params.proposedLocation),
    [params.proposedLocation],
  );
  const hasPickLocation = Boolean(pickLocation);

  const contactEmail = (params.contactEmail ?? "").trim();
  const phoneNumber = (params.phoneNumber ?? "").trim();
  const emailPathEnabled =
    hasBusinessTarget && Boolean(contactEmail) && isWorkEmail(contactEmail);
  const phonePathEnabled = hasBusinessTarget && Boolean(phoneNumber);

  const [step, setStep] = useState<FormStep>("paths");
  const [maskedEmail, setMaskedEmail] = useState(
    contactEmail ? maskEmail(contactEmail) : "",
  );
  const [maskedPhone, setMaskedPhone] = useState(
    phoneNumber ? maskPhone(phoneNumber) : "",
  );
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [otpSentAtLabel, setOtpSentAtLabel] = useState("");

  const [workEmail, setWorkEmail] = useState("");
  const [proof, setProof] = useState<RNFile | null>(null);
  const [proposedName, setProposedName] = useState(params.proposedName ?? "");
  const [proposedType, setProposedType] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [proposedWebsite, setProposedWebsite] = useState("");
  const [proposedLocation, setProposedLocation] = useState<GeoLocation | null>(
    pickLocation,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const businessTypesQuery = useQuery({
    queryKey: ["business-types"],
    queryFn: async () => {
      const response = await businessService.fetchBusinessTypes();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data ?? [];
    },
    enabled: needsProposedFields,
  });

  const businessTypeOptions = useMemo(
    () =>
      (businessTypesQuery.data ?? []).map((item) => ({
        value: item.name,
        label: item.name,
      })),
    [businessTypesQuery.data],
  );

  const targetName = params.targetName || proposedName || "";
  const businessType = params.businessType ?? "";
  const locationLabel = params.locationLabel ?? "";
  const logoUri = resolveImageUrl(params.logo) ?? params.logo ?? "";

  const otpTarget = useMemo(
    () => ({
      business: params.businessId || undefined,
      list_item: isPickClaim ? params.listItemId : undefined,
    }),
    [params.businessId, params.listItemId, isPickClaim],
  );

  const proofIsImage = useMemo(() => {
    if (!proof) return false;
    return proof.type.startsWith("image/");
  }, [proof]);

  const headerTitle =
    step === "email"
      ? t("claimBusiness.form.emailVerifyTitle")
      : step === "phone"
        ? t("claimBusiness.form.phoneVerifyTitle")
        : step === "document"
          ? t("claimBusiness.form.documentTitle")
          : t("claimBusiness.form.title");

  const goSubmitted = () => {
    router.replace("/(app)/(stack)/claim-business/submitted");
  };

  const startEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await businessService.startClaimEmailOtp(otpTarget);
      if (response.error) {
        throw new Error(
          response.error.message || t("claimBusiness.form.submitError"),
        );
      }
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (data?.masked_email) setMaskedEmail(data.masked_email);
      setOtpSentAtLabel(formatNowTime());
      setEmailCode("");
      setStep("email");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("claimBusiness.form.submitError"), {
        title: t("alerts.error"),
      });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (otp_code: string) => {
      const response = await businessService.verifyClaimEmailOtp({
        ...otpTarget,
        otp_code,
      });
      if (response.error) {
        throw new Error(
          response.error.message || t("claimBusiness.form.otpInvalid"),
        );
      }
      return response.data?.data;
    },
    onSuccess: () => goSubmitted(),
    onError: (error: Error) => {
      toast.error(error.message || t("claimBusiness.form.otpInvalid"), {
        title: t("alerts.error"),
      });
    },
  });

  const startPhoneMutation = useMutation({
    mutationFn: async () => {
      const response = await businessService.startClaimPhoneOtp(otpTarget);
      if (response.error) {
        throw new Error(
          response.error.message || t("claimBusiness.form.submitError"),
        );
      }
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (data?.masked_phone) setMaskedPhone(data.masked_phone);
      setOtpSentAtLabel(formatNowTime());
      setPhoneCode("");
      setStep("phone");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("claimBusiness.form.submitError"), {
        title: t("alerts.error"),
      });
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async (otp_code: string) => {
      const response = await businessService.verifyClaimPhoneOtp({
        ...otpTarget,
        otp_code,
      });
      if (response.error) {
        throw new Error(
          response.error.message || t("claimBusiness.form.otpInvalid"),
        );
      }
      return response.data?.data;
    },
    onSuccess: () => goSubmitted(),
    onError: (error: Error) => {
      toast.error(error.message || t("claimBusiness.form.otpInvalid"), {
        title: t("alerts.error"),
      });
    },
  });

  const submitDocumentMutation = useMutation({
    mutationFn: async () => {
      const response = await businessService.submitBusinessClaim({
        verification_method: "document",
        work_email: workEmail.trim(),
        proof_of_ownership: proof!,
        business: !isPickClaim ? params.businessId : undefined,
        list_item: isPickClaim ? params.listItemId : undefined,
        source: isPickClaim ? "list_item" : undefined,
        proposed_name: needsProposedFields ? proposedName.trim() : undefined,
        proposed_business_type: needsProposedFields
          ? proposedType.trim() || undefined
          : undefined,
        proposed_website: needsProposedFields
          ? proposedWebsite.trim() || undefined
          : undefined,
        proposed_location:
          needsProposedFields && proposedLocation
            ? {
                street_address: proposedLocation.street_address ?? "",
                postal_code: proposedLocation.postal_code ?? "",
                city: proposedLocation.city,
                region: proposedLocation.region,
                country: proposedLocation.country,
                latitude: proposedLocation.latitude,
                longitude: proposedLocation.longitude,
              }
            : undefined,
      });
      if (response.error) {
        throw new Error(
          response.error.message || t("claimBusiness.form.submitError"),
        );
      }
      return response.data?.data;
    },
    onSuccess: () => goSubmitted(),
    onError: (error: Error) => {
      toast.error(error.message || t("claimBusiness.form.submitError"), {
        title: t("alerts.error"),
      });
    },
  });

  const validateDocument = (): boolean => {
    const next: Record<string, string> = {};
    if (!workEmail.trim()) {
      next.workEmail = t("validation.emailRequired");
    } else if (!isWorkEmail(workEmail)) {
      next.workEmail = t("claimBusiness.form.workEmailInvalid");
    }
    if (!proof) {
      next.proof = t("claimBusiness.form.proofRequired");
    }
    if (needsProposedFields && !proposedName.trim()) {
      next.proposedName = t("claimBusiness.form.proposedNameRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_PROOF_BYTES) {
      setErrors((prev) => ({
        ...prev,
        proof: t("claimBusiness.form.proofHint"),
      }));
      return;
    }

    const ext = asset.uri.split(".").pop() ?? "jpg";
    setProof({
      uri: asset.uri,
      name: asset.fileName ?? `proof.${ext}`,
      type: asset.mimeType ?? `image/${ext}`,
    });
    setErrors((prev) => {
      const { proof: _removed, ...rest } = prev;
      return rest;
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_PROOF_BYTES) {
      setErrors((prev) => ({
        ...prev,
        proof: t("claimBusiness.form.proofHint"),
      }));
      return;
    }

    setProof({
      uri: asset.uri,
      name: asset.name,
      type: guessMimeType(asset.name, asset.mimeType),
    });
    setErrors((prev) => {
      const { proof: _removed, ...rest } = prev;
      return rest;
    });
  };

  const renderBusinessCard = () => (
    <WhiteBox className="mb-5 flex-row items-center gap-3">
      <View className="h-14 w-14 overflow-hidden rounded-xl bg-soft dark:bg-gray-700">
        {logoUri ? (
          <Image
            source={{ uri: logoUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="font-geist-bold text-lg text-gray-400">
              {(targetName || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1">
        {businessType ? (
          <Text className="font-geist-medium text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {businessType}
          </Text>
        ) : null}
        <Text
          className="font-geist-semibold text-[15px] text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {targetName || t("claimBusiness.form.untitledBusiness")}
        </Text>
        {locationLabel ? (
          <Text
            className="mt-0.5 font-geist text-[12px] text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {locationLabel}
          </Text>
        ) : null}
      </View>
    </WhiteBox>
  );

  const renderPathRow = ({
    enabled,
    selected,
    icon,
    title,
    body,
    timing,
    badge,
    onPress,
  }: {
    enabled: boolean;
    selected?: boolean;
    icon: ReactNode;
    title: string;
    body: string;
    timing: string;
    badge?: string;
    onPress: () => void;
  }) => (
    <Pressable
      disabled={
        !enabled || startEmailMutation.isPending || startPhoneMutation.isPending
      }
      onPress={onPress}
      className={cn(
        "mb-3 rounded-2xl border p-4 cursor-pointer",
        selected
          ? "border-brand bg-brand-tint dark:bg-brand/20"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        !enabled && "opacity-45",
      )}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-soft dark:bg-gray-700">
          {icon}
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-geist-semibold text-[14px] text-ink dark:text-gray-100">
              {title}
            </Text>
            {badge ? (
              <View className="rounded-md bg-brand-tint px-1.5 py-0.5 dark:bg-brand/30">
                <Text className="font-geist-bold text-[10px] uppercase tracking-wide text-brand">
                  {badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-1 font-geist text-[13px] leading-5 text-gray-600 dark:text-gray-300">
            {body}
          </Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <Clock size={12} color="#9CA3AF" />
            <Text className="font-geist text-[11px] text-gray-500 dark:text-gray-400">
              {timing}
            </Text>
          </View>
          {!enabled ? (
            <Text className="mt-2 font-geist text-[11px] text-gray-500 dark:text-gray-400">
              {t("claimBusiness.form.pathUnavailable")}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={18} color="#9CA3AF" />
      </View>
    </Pressable>
  );

  const renderOtpProgress = (channel: "email" | "phone") => {
    const sentLabel =
      channel === "email"
        ? t("claimBusiness.form.timelineEmailSent")
        : t("claimBusiness.form.timelineCallPlaced");
    return (
      <View className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <View className="flex-row items-start gap-3">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-success">
            <Check size={14} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="font-geist-semibold text-[13px] text-ink dark:text-gray-100">
              {sentLabel}
            </Text>
            <Text className="mt-0.5 font-geist text-[12px] text-gray-500">
              {t("claimBusiness.form.timelineJustNow", {
                time: otpSentAtLabel,
              })}
            </Text>
          </View>
        </View>
        <View className="my-3 ml-3.5 h-4 w-px bg-gray-200 dark:bg-gray-600" />
        <View className="flex-row items-start gap-3">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-brand">
            <Text className="font-geist-bold text-[12px] text-white">2</Text>
          </View>
          <View className="flex-1">
            <Text className="font-geist-semibold text-[13px] text-ink dark:text-gray-100">
              {t("claimBusiness.form.timelineVerify")}
            </Text>
            <Text className="mt-0.5 font-geist text-[12px] text-brand">
              {t("claimBusiness.form.timelineInProgress")}
            </Text>
          </View>
        </View>
        <View className="my-3 ml-3.5 h-4 w-px bg-gray-200 dark:bg-gray-600" />
        <View className="flex-row items-start gap-3 opacity-50">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
            <Text className="font-geist-bold text-[12px] text-gray-600 dark:text-gray-300">
              3
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-geist-semibold text-[13px] text-ink dark:text-gray-100">
              {t("claimBusiness.form.timelineReview")}
            </Text>
            <Text className="mt-0.5 font-geist text-[12px] text-gray-500">
              {t("claimBusiness.form.timelineAfterVerify")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={headerTitle}
        onBack={
          step !== "paths"
            ? () => {
                setStep("paths");
                setEmailCode("");
                setPhoneCode("");
              }
            : undefined
        }
      />
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-36 pt-4"
      >
        {step === "paths" ? (
          <>
            {renderBusinessCard()}
            <Text className="font-geist-bold text-[26px] leading-8 text-ink dark:text-gray-100 mt-2">
              {t("claimBusiness.form.heroLead")}{" "}
              <Text className="font-fraunces text-[26px] text-brand">
                {t("claimBusiness.form.heroEm")}
              </Text>
            </Text>
            <Text className="mt-3 font-geist text-[14px] leading-6 text-gray-600 dark:text-gray-300">
              {t("claimBusiness.form.heroBody", {
                name: targetName || t("claimBusiness.form.untitledBusiness"),
              })}
            </Text>

            <Text className="mb-3 mt-6 font-geist-medium text-[11px] uppercase tracking-widest text-gray-500">
              {t("claimBusiness.form.pickPath")}
            </Text>

            {renderPathRow({
              enabled: emailPathEnabled,
              selected: false,
              icon: <Mail size={18} color="#6B7280" />,
              title: t("claimBusiness.form.pathEmailTitle"),
              body: emailPathEnabled
                ? t("claimBusiness.form.pathEmailBody", {
                    email: contactEmail,
                  })
                : t("claimBusiness.form.pathEmailUnavailable"),
              timing: t("claimBusiness.form.pathEmailTiming"),
              badge: t("claimBusiness.form.fastest"),
              onPress: () => startEmailMutation.mutate(),
            })}

            {renderPathRow({
              enabled: phonePathEnabled,
              icon: <Phone size={18} color="#6B7280" />,
              title: t("claimBusiness.form.pathPhoneTitle"),
              body: phonePathEnabled
                ? t("claimBusiness.form.pathPhoneBody", {
                    phone: phoneNumber,
                  })
                : t("claimBusiness.form.pathPhoneUnavailable"),
              timing: t("claimBusiness.form.pathPhoneTiming"),
              onPress: () => startPhoneMutation.mutate(),
            })}

            {renderPathRow({
              enabled: true,
              icon: <FileText size={18} color="#6B7280" />,
              title: t("claimBusiness.form.pathDocumentTitle"),
              body: t("claimBusiness.form.pathDocumentBody"),
              timing: t("claimBusiness.form.pathDocumentTiming"),
              onPress: () => setStep("document"),
            })}

            <Text className="mt-2 text-center font-fraunces text-md leading-7 text-gray-500 dark:text-gray-400">
              {t("claimBusiness.form.terms")}
            </Text>
          </>
        ) : null}

        {step === "email" ? (
          <>
            <Text className="font-geist-medium text-[11px] uppercase tracking-widest text-brand">
              {t("claimBusiness.form.stepCodeSent")}
            </Text>
            <Text className="mt-2 font-geist-bold text-[24px] text-ink dark:text-gray-100">
              {t("claimBusiness.form.enterCode")}
            </Text>
            <Text className="mt-2 font-geist text-[14px] leading-5 text-gray-600 dark:text-gray-300">
              {t("claimBusiness.form.codeSentTo", { email: maskedEmail })}
            </Text>
            <View className="mt-6">
              <OtpInput value={emailCode} onChange={setEmailCode} />
            </View>
            <Text className="mt-4 font-geist text-[13px] text-gray-600 dark:text-gray-300">
              {t("claimBusiness.form.didntGetIt")}{" "}
              <Text
                className="font-geist-semibold text-brand"
                onPress={() => startEmailMutation.mutate()}
              >
                {t("claimBusiness.form.resendCode")}
              </Text>
              {" · "}
              <Text
                className="font-geist-semibold text-brand"
                onPress={() => setStep("paths")}
              >
                {t("claimBusiness.form.tryDifferentPath")}
              </Text>
            </Text>
            {renderOtpProgress("email")}
          </>
        ) : null}

        {step === "phone" ? (
          <>
            <Text className="font-geist-medium text-[11px] uppercase tracking-widest text-brand">
              {t("claimBusiness.form.stepCodeCalled")}
            </Text>
            <Text className="mt-2 font-geist-bold text-[24px] text-ink dark:text-gray-100">
              {t("claimBusiness.form.enterCode")}
            </Text>
            <Text className="mt-2 font-geist text-[14px] leading-5 text-gray-600 dark:text-gray-300">
              {t("claimBusiness.form.codeCalledTo", { phone: maskedPhone })}
            </Text>
            <View className="mt-6">
              <OtpInput value={phoneCode} onChange={setPhoneCode} />
            </View>
            <Text className="mt-4 font-geist text-[13px] text-gray-600 dark:text-gray-300">
              {t("claimBusiness.form.didntGetIt")}{" "}
              <Text
                className="font-geist-semibold text-brand"
                onPress={() => startPhoneMutation.mutate()}
              >
                {t("claimBusiness.form.resendCall")}
              </Text>
              {" · "}
              <Text
                className="font-geist-semibold text-brand"
                onPress={() => setStep("paths")}
              >
                {t("claimBusiness.form.tryDifferentPath")}
              </Text>
            </Text>
            {renderOtpProgress("phone")}
          </>
        ) : null}

        {step === "document" ? (
          <>
            {renderBusinessCard()}
            <TextInput
              label={t("claimBusiness.form.workEmail")}
              hint={t("claimBusiness.form.workEmailHint")}
              required
              value={workEmail}
              onChangeText={setWorkEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.workEmail}
              containerClassName="mb-4"
            />

            <View className="mb-4">
              <FieldLabel
                label={t("claimBusiness.form.proof")}
                required
                hint={t("claimBusiness.form.proofHint")}
              />
              {proof ? (
                <View className="mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                  {proofIsImage ? (
                    <Image
                      source={{ uri: proof.uri }}
                      className="h-40 w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-row items-center gap-3 px-4 py-4">
                      <FileText size={20} color="#FF6B1A" />
                      <Text
                        className="min-w-0 flex-1 font-geist text-sm text-ink dark:text-gray-100"
                        numberOfLines={1}
                      >
                        {proof.name}
                      </Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => setProof(null)}
                    className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/50 cursor-pointer"
                  >
                    <X size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : (
                <View className="mt-2 flex-row gap-2">
                  <View className="flex-1">
                    <LocalNotesButton
                      label={t("claimBusiness.form.proofPickImage")}
                      variant="light"
                      size="sm"
                      onPress={() => {
                        void pickImage();
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <LocalNotesButton
                      label={t("claimBusiness.form.proofPickDocument")}
                      variant="light"
                      size="sm"
                      onPress={() => {
                        void pickDocument();
                      }}
                    />
                  </View>
                </View>
              )}
              {errors.proof ? (
                <Text className="mt-1 font-geist text-xs text-error">
                  {errors.proof}
                </Text>
              ) : null}
            </View>

            {needsProposedFields ? (
              <>
                <TextInput
                  label={t("claimBusiness.form.proposedName")}
                  required
                  value={proposedName}
                  onChangeText={setProposedName}
                  error={errors.proposedName}
                  containerClassName="mb-4"
                />
                <View className="mb-4 w-full">
                  <FieldLabel label={t("claimBusiness.form.proposedType")} />
                  <Pressable
                    onPress={() => setTypePickerOpen(true)}
                    accessibilityRole="button"
                    className="mt-1.5 h-14 flex-row items-center rounded-xl border border-gray-100 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                  >
                    <Text
                      className={cn(
                        "flex-1 font-geist text-base",
                        proposedType
                          ? "text-ink dark:text-gray-100"
                          : "text-gray-400 dark:text-gray-500",
                      )}
                    >
                      {proposedType ||
                        t("claimBusiness.form.proposedTypePlaceholder")}
                    </Text>
                    <ChevronDown size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
                <TextInput
                  label={t("claimBusiness.form.proposedWebsite")}
                  value={proposedWebsite}
                  onChangeText={setProposedWebsite}
                  autoCapitalize="none"
                  keyboardType="url"
                  containerClassName="mb-4"
                />
                {!hasPickLocation ? (
                  <View className="mb-4">
                    <FieldLabel
                      label={t("claimBusiness.form.proposedLocation")}
                    />
                    <View className="mt-2">
                      <LocationInput
                        onLocationSelected={setProposedLocation}
                        biasToUserLocation={false}
                      />
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}

            <Pressable
              onPress={() => setStep("paths")}
              className="mt-2 cursor-pointer"
            >
              <Text className="font-geist-semibold text-[13px] text-brand">
                {t("claimBusiness.form.tryDifferentPath")}
              </Text>
            </Pressable>
          </>
        ) : null}
      </KeyboardAwareScrollView>

      {step === "email" ? (
        <KeyboardStickyView
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        >
          <BottomWrapper style={{ position: "relative" }}>
            <LocalNotesButton
              label={
                verifyEmailMutation.isPending
                  ? t("claimBusiness.form.verifying")
                  : t("claimBusiness.form.verifyCode")
              }
              variant="dark"
              loading={verifyEmailMutation.isPending}
              disabled={emailCode.length < 6}
              onPress={() => verifyEmailMutation.mutate(emailCode)}
            />
          </BottomWrapper>
        </KeyboardStickyView>
      ) : null}

      {step === "phone" ? (
        <KeyboardStickyView
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        >
          <BottomWrapper style={{ position: "relative" }}>
            <LocalNotesButton
              label={
                verifyPhoneMutation.isPending
                  ? t("claimBusiness.form.verifying")
                  : t("claimBusiness.form.verifyCode")
              }
              variant="dark"
              loading={verifyPhoneMutation.isPending}
              disabled={phoneCode.length < 6}
              onPress={() => verifyPhoneMutation.mutate(phoneCode)}
            />
          </BottomWrapper>
        </KeyboardStickyView>
      ) : null}

      {step === "document" ? (
        <KeyboardStickyView
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        >
          <BottomWrapper style={{ position: "relative" }}>
            <LocalNotesButton
              label={
                submitDocumentMutation.isPending
                  ? t("claimBusiness.form.submitting")
                  : t("claimBusiness.form.submit")
              }
              variant="dark"
              loading={submitDocumentMutation.isPending}
              onPress={() => {
                if (!validateDocument()) return;
                submitDocumentMutation.mutate();
              }}
            />
          </BottomWrapper>
        </KeyboardStickyView>
      ) : null}

      <DropDown
        visible={typePickerOpen}
        options={businessTypeOptions}
        selected={proposedType}
        onApply={setProposedType}
        onClose={() => setTypePickerOpen(false)}
        isSearchable
        searchPlaceholder={t("common.search")}
      />
    </View>
  );
}
