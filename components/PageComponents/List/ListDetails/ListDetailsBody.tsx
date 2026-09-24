import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  mapItemToListItemPublic,
  PickPreviewRow,
} from "@/components/ui/ListCardDetailed";
import { ListEngagementRow } from "@/components/ui/ListEngagementRow";
import { PersonalityMatchPill } from "@/components/ui/PersonalityMatchPill";
import { PickDetailModal } from "@/components/PageComponents/Profile/PickDetailModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatListLocation } from "@/utils/listUi";
import { getListMatchPercent } from "@/utils/matchScore";
import type { Item, ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import type { ViewOrigin } from "@/http/types";

interface ListDetailsBodyProps {
  list: ListItemDAO;
  viewOrigin: ViewOrigin;
}

export function ListDetailsBody({ list, viewOrigin }: ListDetailsBodyProps) {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnList = currentUserId === list.account.id;
  const items = list.items ?? [];
  const locationLabel = formatListLocation(list.location);
  const personalityMatch = getListMatchPercent(list) ?? 0;

  const [selectedPick, setSelectedPick] = useState<ListItemPublic | null>(null);
  const [isPickDetailOpen, setIsPickDetailOpen] = useState(false);

  const handlePickPress = useCallback(
    (item: Item) => {
      setSelectedPick(mapItemToListItemPublic(item, list, isOwnList));
      setIsPickDetailOpen(true);
    },
    [list, isOwnList],
  );

  return (
    <>
      {items.length === 0 ? (
        <View className="mt-4 px-4">
          <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
            {t("listDetail.noPicks")}
          </Text>
        </View>
      ) : (
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
      )}

      {/* Like Comment and Bookmark */}
      <ListEngagementRow list={list} className="mt-3 px-4" />

      {/* Location and match % */}
      <View className="px-2 mt-2">
        {locationLabel || !isOwnList ? (
          <View className="mt-3 flex-row items-center gap-1.5 px-1.5">
            {locationLabel ? (
              <>
                <MapPin size={14} color="#57534E" />
                <Text
                  className="flex-1 font-geist-semibold text-[13px] text-gray-500 dark:text-gray-400"
                  numberOfLines={2}
                >
                  {locationLabel}
                </Text>
              </>
            ) : (
              <View className="flex-1" />
            )}
            {!isOwnList ? (
              <PersonalityMatchPill
                percent={personalityMatch}
                personalityColor={list.account.personality_color}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {selectedPick ? (
        <PickDetailModal
          visible={isPickDetailOpen}
          onClose={() => setIsPickDetailOpen(false)}
          data={selectedPick}
          viewOrigin={viewOrigin}
        />
      ) : null}
    </>
  );
}
