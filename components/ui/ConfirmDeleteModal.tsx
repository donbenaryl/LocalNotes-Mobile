import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { LocalNotesButton } from "./LocalNotesButton";

interface ConfirmDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  message?: string;
}

export function ConfirmDeleteModal({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  message,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title ?? t("profile.lists.deleteTitle")}
      position="bottom"
    >
      <Text className="font-geist text-sm text-gray-600 dark:text-gray-400 mb-6">
        {message ?? t("profile.lists.deleteMessage")}
      </Text>
      <View className="flex-row gap-3">
        <LocalNotesButton
          label={t("common.cancel")}
          onPress={onClose}
          variant="light"
          size="sm"
          disabled={isLoading}
          className="flex-1"
        />
        <LocalNotesButton
          label={t("profile.lists.delete")}
          onPress={onConfirm}
          variant="dark"
          size="sm"
          disabled={isLoading}
          className="flex-1 bg-red-700 border border-red-700"
        />
      </View>
    </Modal>
  );
}
