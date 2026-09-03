import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Flag } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import accountService from "@/http/account-api/account.services";
import type {
  AccountReportReason,
  ReportContentType,
  ReportUserDTO,
} from "@/http/account-api/types";
import { useToastStore } from "@/stores/useToastStore";
import { COLORS } from "@/constants/colors";

const REPORT_REASONS: AccountReportReason[] = [
  "spam",
  "harassment",
  "hate_speech",
  "sexual_content",
  "dangerous",
  "minor_sexual_content",
  "impersonation",
  "other",
];

export interface ReportUserSheetProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
  contentType?: ReportContentType;
  contentId?: string;
}

export function ReportUserSheet({
  visible,
  onClose,
  userId,
  displayName,
  contentType,
  contentId,
}: ReportUserSheetProps) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const [reason, setReason] = useState<AccountReportReason | null>(null);
  const [details, setDetails] = useState("");

  const isOther = reason === "other";
  const trimmedDetails = details.trim();

  const reasonLabels = useMemo(
    () =>
      Object.fromEntries(
        REPORT_REASONS.map((key) => [key, t(`profile.safety.reportReasons.${key}`)]),
      ) as Record<AccountReportReason, string>,
    [t],
  );

  const reportMutation = useMutation({
    mutationFn: (payload: ReportUserDTO) => accountService.reportUser(userId, payload),
    onSuccess: () => {
      showToast({ type: "success", message: t("profile.safety.reportSuccess") });
      setReason(null);
      setDetails("");
      onClose();
    },
    onError: () => {
      showToast({ type: "error", message: t("profile.safety.reportError") });
    },
  });

  const handleSubmit = () => {
    if (!reason) return;
    if (isOther && !trimmedDetails) return;
    const payload: ReportUserDTO = {
      reason,
      details: trimmedDetails || undefined,
    };
    if (contentType && contentId) {
      payload.content_type = contentType;
      payload.content_id = contentId;
    }
    reportMutation.mutate(payload);
  };

  const handleClose = () => {
    if (reportMutation.isPending) return;
    setReason(null);
    setDetails("");
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} position="bottom">
      <View>
        <View className="mb-4 items-center border-b border-gray-100 pb-4 dark:border-gray-800">
          <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
            <Flag size={22} color={COLORS.error} strokeWidth={2.2} />
          </View>
          <Text className="text-center font-geist-bold text-lg text-ink dark:text-gray-100">
            {t("profile.safety.reportTitle", { name: displayName })}
          </Text>
          <Text className="mt-2 text-center font-geist text-sm leading-5 text-gray-600 dark:text-gray-400">
            {t("profile.safety.reportBody")}
          </Text>
        </View>

        <View className="-mx-4 flex-row flex-wrap">
          {REPORT_REASONS.map((option) => {
            const selected = reason === option;
            return (
              <View key={option} className="w-1/2 px-1 pb-2">
                <Pressable
                  onPress={() => setReason(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className={`rounded-xl border px-3 py-3 ${
                    selected
                      ? "border-brand bg-brand-tint/60 dark:border-brand/40 dark:bg-brand/10"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <Text
                    className={`font-geist-medium text-sm ${
                      selected ? "text-brand" : "text-ink dark:text-gray-100"
                    }`}
                  >
                    {reasonLabels[option]}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
            {t("profile.safety.reportDetailsLabel")}
          </Text>
          <Text
            className={`font-geist text-xs ${
              isOther ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {isOther
              ? t("profile.safety.reportDetailsRequired")
              : t("profile.safety.reportDetailsOptional")}
          </Text>
        </View>
        <TextInput
          value={details}
          onChangeText={(text) => setDetails(text.slice(0, 500))}
          placeholder={t("profile.safety.reportDetailsPlaceholder")}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
          className="mt-1.5 min-h-[88px] rounded-xl border border-gray-200 bg-white px-4 py-3 font-geist text-sm text-ink dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <Text className="mt-1 text-right font-geist text-xs text-gray-400 dark:text-gray-500">
          {details.length}/500
        </Text>

        <View className="mt-3 flex-row gap-3">
          <LocalNotesButton
            label={t("profile.safety.reportCancel")}
            onPress={handleClose}
            variant="light"
            isWidthFull={false}
            className="flex-1"
            disabled={reportMutation.isPending}
          />
          <LocalNotesButton
            label={t("profile.safety.reportSubmit")}
            onPress={handleSubmit}
            variant="danger"
            isWidthFull={false}
            className="flex-1"
            loading={reportMutation.isPending}
            disabled={!reason || (isOther && !trimmedDetails) || reportMutation.isPending}
          />
        </View>
      </View>
    </Modal>
  );
}
