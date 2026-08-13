import { Text, View } from "react-native";
import { Ban } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { COLORS } from "@/constants/colors";

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BlockUserModal({
  visible,
  onClose,
  displayName,
  onConfirm,
  isLoading = false,
}: BlockUserModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} onClose={onClose} position="center">
      <View className="items-center">
        <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
          <Ban size={22} color={COLORS.error} strokeWidth={2.2} />
        </View>
        <Text className="text-center font-geist-bold text-xl text-ink dark:text-gray-100">
          {t("profile.safety.blockTitle", { name: displayName })}
        </Text>
        <Text className="mt-3 text-center font-geist text-sm leading-5 text-gray-600 dark:text-gray-400">
          {t("profile.safety.blockBodyBefore")}
          <Text className="font-geist-bold text-ink dark:text-gray-100">
            {t("profile.safety.blockBodyEmphasis")}
          </Text>
          {t("profile.safety.blockBodyAfter")}
        </Text>

        <View className="mt-6 w-full gap-3">
          <LocalNotesButton
            label={t("profile.safety.blockConfirm")}
            onPress={onConfirm}
            variant="danger"
            isRounded
            loading={isLoading}
            disabled={isLoading}
          />
          <LocalNotesButton
            label={t("profile.safety.blockCancel")}
            onPress={onClose}
            variant="light"
            isRounded
            disabled={isLoading}
          />
        </View>
      </View>
    </Modal>
  );
}
