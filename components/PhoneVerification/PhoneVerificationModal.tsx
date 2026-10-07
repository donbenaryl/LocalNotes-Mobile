import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import accountService from "@/http/account-api/account.services";
import { formatPhoneForDisplay } from "@/utils/phone";
import { PhoneVerificationForm } from "./PhoneVerificationForm";

interface PhoneVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  /** Currently verified E.164 number, if any. */
  verifiedPhone?: string | null;
}

export function PhoneVerificationModal({
  visible,
  onClose,
  verifiedPhone,
}: PhoneVerificationModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isChanging, setIsChanging] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  // Remount the form on every open so a half-finished flow doesn't linger.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setIsChanging(false);
    setFormKey((key) => key + 1);
  }, [visible]);

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const response = await accountService.removePhone();
      if (response.error || !response.data?.data) {
        toast.error(response.error?.message || t("phoneVerification.removeFailed"));
        return;
      }
      queryClient.setQueryData(["profile"], response.data.data);
      toast.success(t("phoneVerification.removed"));
      onClose();
    } finally {
      setIsRemoving(false);
    }
  };

  const showForm = !verifiedPhone || isChanging;

  return (
    <Modal visible={visible} onClose={onClose} title={t("phoneVerification.title")}>
      <View className="gap-4 pb-2">
        {showForm ? (
          <>
            <Text className="-mt-2 font-geist text-sm text-gray-500 dark:text-gray-400">
              {t("phoneVerification.subtitle")}
            </Text>
            <PhoneVerificationForm
              key={formKey}
              onVerified={() => {
                toast.success(t("phoneVerification.verified"));
                onClose();
              }}
            />
          </>
        ) : (
          <>
            <View className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-gray-800">
              <Text className="font-geist text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("phoneVerification.verifiedLabel")}
              </Text>
              <Text className="mt-1 font-geist-semibold text-base text-ink dark:text-gray-100">
                {formatPhoneForDisplay(verifiedPhone)}
              </Text>
            </View>
            <LocalNotesButton
              label={t("phoneVerification.changeNumber")}
              onPress={() => setIsChanging(true)}
              variant="light"
            />
            <LocalNotesButton
              label={t("phoneVerification.remove")}
              onPress={() => void handleRemove()}
              loading={isRemoving}
              variant="ghost"
            />
          </>
        )}
      </View>
    </Modal>
  );
}
