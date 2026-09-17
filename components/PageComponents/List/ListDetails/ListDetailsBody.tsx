import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  mapItemToListItemPublic,
  PickPreviewRow,
} from "@/components/ui/ListCardDetailed";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Item, ListItemDAO, ListItemPublic } from "@/http/list-api/types";

interface ListDetailsBodyProps {
  list: ListItemDAO;
}

export function ListDetailsBody({ list }: ListDetailsBodyProps) {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnList = currentUserId === list.account.id;
  const items = list.items ?? [];

  const [selectedPick, setSelectedPick] = useState<ListItemPublic | null>(null);
  const [isPickDetailOpen, setIsPickDetailOpen] = useState(false);

  const handlePickPress = useCallback(
    (item: Item) => {
      setSelectedPick(mapItemToListItemPublic(item, list, isOwnList));
      setIsPickDetailOpen(true);
    },
    [list, isOwnList],
  );

  if (items.length === 0) {
    return (
      <View className="mt-4 px-4">
        <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
          {t("listDetail.noPicks")}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View className="mt-2 border-t border-gray-100 px-4 dark:border-gray-800">
        {items.map((item, index) => (
          <View
            key={item.id}
            className={
              index > 0
                ? "border-t border-gray-100 dark:border-gray-800"
                : undefined
            }
          >
            <PickPreviewRow
              item={item}
              index={index}
              personalityColor={list.account.personality_color}
              onPress={() => handlePickPress(item)}
            />
          </View>
        ))}
      </View>

      {selectedPick ? (
        <PickDetailModal
          visible={isPickDetailOpen}
          onClose={() => setIsPickDetailOpen(false)}
          data={selectedPick}
        />
      ) : null}
    </>
  );
}
