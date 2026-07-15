import type { ReactNode } from "react";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Edit,
  MoreHorizontal,
  Pin,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";

interface CardOptionsMenuActionItem {
  kind: "action";
  key: string;
  label: string;
  icon?: LucideIcon;
  renderIcon?: (color: string) => ReactNode;
  onPress: () => void | Promise<void>;
  variant?: "default" | "brand" | "destructive";
}

interface CardOptionsMenuCustomItem {
  kind: "custom";
  key: string;
  render: () => ReactNode;
}

export type CardOptionsMenuItem =
  | CardOptionsMenuActionItem
  | CardOptionsMenuCustomItem;

interface CardOptionsMenuProps {
  items?: CardOptionsMenuItem[];
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  pinIcon?: LucideIcon;
  isDeleting?: boolean;
}

interface ButtonLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CardOptionsMenu({
  items,
  onEdit,
  onDelete,
  onPin,
  pinIcon: PinIcon = Pin,
  isDeleting = false,
}: CardOptionsMenuProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();

  const [visible, setVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<ButtonLayout | null>(null);
  const [menuItems, setMenuItems] = useState<CardOptionsMenuItem[] | undefined>(
    items,
  );
  const triggerRef = useRef<View>(null);
  const actionLockRef = useRef(false);

  const open = () => {
    // Freeze items at open so later parent state updates don't remount rows mid-press.
    setMenuItems(items);
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setButtonLayout({ x, y, width, height });
      setVisible(true);
    });
  };

  const close = () => {
    setVisible(false);
    actionLockRef.current = false;
  };

  const handleEdit = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    close();
    onEdit?.();
  };

  const handleDelete = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    close();
    onDelete?.();
  };

  const handlePin = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    close();
    onPin?.();
  };

  const isDark = colorScheme === "dark";
  const iconColorDefault = isDark ? "#F3F4F6" : "#141413";
  const iconColorBrand = "#FF6B1A";
  const iconColorDestructive = "#EF4444";
  const hasCustomItems = Boolean(menuItems?.length);

  const dropdownTop = buttonLayout
    ? buttonLayout.y + buttonLayout.height - 6
    : 0;
  const dropdownRight = buttonLayout
    ? screenWidth - buttonLayout.x - buttonLayout.width
    : 0;

  const handleActionItemPress = (item: CardOptionsMenuActionItem) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    const action = item.onPress;
    setVisible(false);
    // Defer so the modal fully dismisses before the action runs — avoids
    // ghost presses landing on other menu rows or content underneath.
    setTimeout(() => {
      void Promise.resolve(action()).finally(() => {
        actionLockRef.current = false;
      });
    }, 0);
  };

  const getActionStyles = (
    variant: CardOptionsMenuActionItem["variant"] = "default",
  ) => {
    if (variant === "brand") {
      return {
        pressable:
          "flex-row items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-700",
        text: "font-geist text-sm text-brand",
        iconColor: iconColorBrand,
      };
    }

    if (variant === "destructive") {
      return {
        pressable:
          "flex-row items-center gap-3 px-4 py-3 active:bg-red-50 dark:active:bg-red-950",
        text: "font-geist text-sm text-red-500",
        iconColor: iconColorDestructive,
      };
    }

    return {
      pressable:
        "flex-row items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-700",
      text: "font-geist text-sm text-ink dark:text-gray-100",
      iconColor: iconColorDefault,
    };
  };

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={open}
          disabled={isDeleting}
          accessibilityRole="button"
          className="cursor-pointer rounded-full p-1"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <MoreHorizontal size={20} color="#6B7280" />
          )}
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View className="flex-1">
          <Pressable className="absolute inset-0" onPress={close} />

          {buttonLayout ? (
            <View
              className={`absolute ${hasCustomItems ? "w-56" : "w-44"} overflow-hidden rounded-xl border border-gray-200 bg-white py-2 dark:border-gray-700 dark:bg-gray-800`}
              style={{
                top: dropdownTop,
                right: dropdownRight,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {menuItems?.length
                ? menuItems.map((item) => {
                    if (item.kind === "custom") {
                      return <View key={item.key}>{item.render()}</View>;
                    }

                    const styles = getActionStyles(item.variant);
                    const Icon = item.icon;

                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => handleActionItemPress(item)}
                        accessibilityRole="button"
                        className={styles.pressable}
                      >
                        {item.renderIcon
                          ? item.renderIcon(styles.iconColor)
                          : null}
                        {item.renderIcon ? null : Icon ? (
                          <Icon size={15} color={styles.iconColor} />
                        ) : null}
                        <Text className={styles.text}>{item.label}</Text>
                      </Pressable>
                    );
                  })
                : (
                  <>
                    {onEdit ? (
                      <Pressable
                        onPress={handleEdit}
                        accessibilityRole="button"
                        className="flex-row items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-700"
                      >
                        <Edit size={15} color={iconColorDefault} />
                        <Text className="font-geist text-sm text-ink dark:text-gray-100">
                          {t("profile.lists.edit")}
                        </Text>
                      </Pressable>
                    ) : null}

                    {onPin ? (
                      <Pressable
                        onPress={handlePin}
                        accessibilityRole="button"
                        className="flex-row items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-700"
                      >
                        <PinIcon size={15} color={iconColorBrand} />
                        <Text className="font-geist text-sm text-brand">
                          {t("profile.lists.pin")}
                        </Text>
                      </Pressable>
                    ) : null}

                    {onDelete ? (
                      <Pressable
                        onPress={handleDelete}
                        accessibilityRole="button"
                        className="flex-row items-center gap-3 px-4 py-3 active:bg-red-50 dark:active:bg-red-950"
                      >
                        <Trash2 size={15} color={iconColorDestructive} />
                        <Text className="font-geist text-sm text-red-500">
                          {t("profile.lists.delete")}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}
