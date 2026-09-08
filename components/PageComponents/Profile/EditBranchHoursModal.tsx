import { useEffect, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { OpeningHoursEditor } from "@/components/PageComponents/Profile/BusinessProfileFields";
import {
  emptyOpeningHours,
  normalizeOpeningHours,
  openingHoursForApi,
  validateOpeningHours,
  type OpeningHours,
} from "@/utils/openingHours";
import { toast } from "@/components/ui/Toast";

interface EditBranchHoursModalProps {
  visible: boolean;
  branchName?: string;
  initialHours?: OpeningHours;
  onClose: () => void;
  onSave: (hours: OpeningHours) => Promise<void>;
  loading?: boolean;
}

export function EditBranchHoursModal({
  visible,
  branchName,
  initialHours,
  onClose,
  onSave,
  loading = false,
}: EditBranchHoursModalProps) {
  const { t } = useTranslation();
  const [hours, setHours] = useState<OpeningHours>(emptyOpeningHours());

  useEffect(() => {
    if (visible) {
      setHours(normalizeOpeningHours(initialHours));
    }
  }, [visible, initialHours]);

  async function handleSave() {
    const errorKey = validateOpeningHours(hours);
    if (errorKey) {
      toast.error(t(`editProfile.business.${errorKey}`));
      return;
    }
    await onSave(openingHoursForApi(hours));
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={
        branchName
          ? t("editProfile.business.editBranchHoursTitle", { name: branchName })
          : t("editProfile.business.hoursSection")
      }
      footer={
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <LocalNotesButton
              label={t("common.cancel")}
              onPress={onClose}
              variant="light"
              disabled={loading}
            />
          </View>
          <View className="flex-1">
            <LocalNotesButton
              label={loading ? t("common.pleaseWait") : t("common.save")}
              onPress={() => void handleSave()}
              variant="dark"
              disabled={loading}
              loading={loading}
            />
          </View>
        </View>
      }
    >
      <View className="gap-2 pb-24">
        <OpeningHoursEditor
          hours={hours}
          editable={!loading}
          onChange={setHours}
        />
      </View>
    </Modal>
  );
}
