import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { EmptyScreen } from "@/components/ui/EmptyScreen";

interface SavedSectionStateProps {
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  children: ReactNode;
}

export function SavedSectionState({
  isPending,
  isError,
  isEmpty,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  children,
}: SavedSectionStateProps) {
  const { t } = useTranslation();

  if (isPending) {
    return (
      <View className="items-center justify-center gap-3 py-12">
        <ActivityIndicator size="large" color="#FF6B1A" />
        <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
          {t("profile.lists.loading")}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center justify-center gap-4 py-12">
        <Text className="font-geist text-sm text-red-500">
          {t("profile.lists.error")}
        </Text>
        <LocalNotesButton
          label={t("profile.lists.retry")}
          onPress={onRetry}
          variant="dark"
          size="sm"
          isWidthFull={false}
        />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <EmptyScreen
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        className="py-12"
      />
    );
  }

  return <>{children}</>;
}
