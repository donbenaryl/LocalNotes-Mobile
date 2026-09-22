import { Pressable, Text, View } from "react-native";
import {
  Ban,
  Flag,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { COLORS } from "@/constants/colors";

export type ProfileActionKey = "follow" | "report" | "block";

interface ProfileActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  onAction: (action: ProfileActionKey) => void;
  busyAction?: ProfileActionKey | null;
  /** When true, show Follow as the first row. */
  showFollow?: boolean;
  isFollowed?: boolean;
  /** When false, hide Report and Block (e.g. other business profiles). */
  showSafetyActions?: boolean;
}

export function ProfileActionsSheet({
  visible,
  onClose,
  displayName,
  onAction,
  busyAction = null,
  showFollow = false,
  isFollowed = false,
  showSafetyActions = true,
}: ProfileActionsSheetProps) {
  const { t } = useTranslation();
  const shortName = displayName.split(" ")[0] || displayName;

  const rows: {
    key: ProfileActionKey;
    label: string;
    icon: LucideIcon;
    destructive?: boolean;
  }[] = [];

  if (showFollow) {
    rows.push({
      key: "follow",
      label: isFollowed
        ? t("profile.lists.following")
        : t("profile.lists.follow"),
      icon: isFollowed ? UserCheck : UserPlus,
    });
  }

  if (showSafetyActions) {
    rows.push(
      {
        key: "report",
        label: t("profile.safety.report"),
        icon: Flag,
        destructive: true,
      },
      {
        key: "block",
        label: t("profile.safety.block", { name: shortName }),
        icon: Ban,
        destructive: true,
      },
    );
  }

  return (
    <Modal visible={visible} onClose={onClose} position="bottom">
      <View>
        {rows.map((row, index) => {
          const Icon = row.icon;
          const isBusy = busyAction === row.key;
          const iconColor = row.destructive ? COLORS.error : COLORS.gray700;
          return (
            <Pressable
              key={row.key}
              disabled={busyAction != null}
              onPress={() => onAction(row.key)}
              accessibilityRole="button"
              className={`flex-row items-center gap-3 py-3.5 ${
                index < rows.length - 1
                  ? "border-b border-gray-100 dark:border-gray-800"
                  : ""
              } ${isBusy ? "opacity-50" : "active:opacity-70"}`}
            >
              <Icon size={20} color={iconColor} strokeWidth={2} />
              <Text
                className={`flex-1 font-geist text-[15px] ${
                  row.destructive
                    ? "text-red-500"
                    : "text-ink dark:text-gray-100"
                }`}
              >
                {row.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}
