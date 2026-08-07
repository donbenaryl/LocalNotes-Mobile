import { ActivityIndicator, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO } from "@/http/list-api/types";

interface ListDetailModalProps {
  visible: boolean;
  onClose: () => void;
  listId: string | null;
}

export function ListDetailModal({
  visible,
  onClose,
  listId,
}: ListDetailModalProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const sheetMaxHeight = height * 0.85;

  const {
    data: list,
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["list-detail", listId],
    enabled: visible && Boolean(listId),
    queryFn: async (): Promise<ListItemDAO | null> => {
      if (!listId) return null;
      const response = await listService.retrieveList(listId);
      return response.data?.data ?? null;
    },
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      withCloseIcon={false}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: sheetMaxHeight }}
        className="-mx-4"
        contentContainerClassName="pb-2"
        refreshControl={
          <AppRefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
        }
      >
        {isPending ? (
          <View className="items-center justify-center gap-3 py-16">
            <ActivityIndicator size="large" color="#FF6B1A" />
            <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
              {t("listDetail.loading")}
            </Text>
          </View>
        ) : null}

        {isError || (!isPending && !list) ? (
          <View className="items-center gap-3 py-12">
            <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
              {t("listDetail.error")}
            </Text>
            <LocalNotesButton
              label={t("listDetail.retry")}
              onPress={() => void refetch()}
              variant="brand"
              size="sm"
              isWidthFull={false}
            />
          </View>
        ) : null}

        {list ? (
          <ListCardDetailed list={list} onDeleted={() => onClose()} />
        ) : null}
      </ScrollView>
    </Modal>
  );
}
