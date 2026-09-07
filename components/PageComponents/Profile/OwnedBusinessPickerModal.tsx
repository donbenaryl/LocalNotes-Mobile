import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { Check } from "lucide-react-native";
import { Modal } from "@/components/ui/Modal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import type { OwnedBusinessDAO } from "@/http/business-api/types";

interface OwnedBusinessPickerModalProps {
  visible: boolean;
  onClose: () => void;
  businesses: OwnedBusinessDAO[];
  selectedId: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelect: (businessId: string) => void;
  isSaving?: boolean;
}

export function OwnedBusinessPickerModal({
  visible,
  onClose,
  businesses,
  selectedId,
  isLoading = false,
  error = null,
  onRetry,
  onSelect,
  isSaving = false,
}: OwnedBusinessPickerModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const checkColor = colorScheme === "dark" ? "#F3F4F6" : "#141413";

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("editProfile.business.switchBusiness")}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-2"
        className="max-h-[60vh]"
      >
        {isLoading && businesses.length === 0 ? (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color="#FF6B1A" />
          </View>
        ) : error && businesses.length === 0 ? (
          <View className="items-center py-6">
            <Text className="mb-3 text-center font-geist text-sm text-gray-600 dark:text-gray-400">
              {error}
            </Text>
            {onRetry ? (
              <LocalNotesButton
                label={t("common.retry")}
                onPress={onRetry}
                variant="light"
                size="xs"
                isRounded
                isWidthFull={false}
              />
            ) : null}
          </View>
        ) : businesses.length === 0 ? (
          <Text className="py-4 font-geist text-sm text-gray-500">
            {t("editProfile.business.noOwnedBusinesses")}
          </Text>
        ) : (
          businesses.map((item, index) => {
            const isSelected = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item.id)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={`flex-row items-center justify-between py-3 ${
                  index > 0 ? "border-t border-gray-100 dark:border-gray-700" : ""
                }`}
              >
                <View className="min-w-0 flex-1 pr-3">
                  <Text
                    className="font-geist-bold text-[15px] text-ink dark:text-gray-100"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 font-geist text-xs text-gray-500 dark:text-gray-400">
                    {item.role}
                    {item.is_primary
                      ? ` · ${t("editProfile.business.primaryBadge")}`
                      : ""}
                  </Text>
                </View>
                {isSelected ? (
                  <Check size={16} color={checkColor} strokeWidth={2.6} />
                ) : null}
              </Pressable>
            );
          })
        )}
        {isSaving ? (
          <View className="items-center py-3">
            <ActivityIndicator size="small" color="#FF6B1A" />
          </View>
        ) : null}
      </ScrollView>
    </Modal>
  );
}
