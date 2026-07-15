import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { PageLoader } from "@/components/ui/PageLoader";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import listService from "@/http/list-api/list.service";
import { buildMapPicks } from "@/utils/listPickLocation";
import { ListDetailsHeader } from "./ListDetailsHeader";
import { ListDetailsBody } from "./ListDetailsBody";
import { ListDetailsComments } from "./ListDetailsComments";
import { ListDetailsMap } from "./ListDetailsMap";
import type { ListItemDAO } from "@/http/list-api/types";

interface ListDetailsMainProps {
  listId?: string;
}

export function ListDetailsMain({ listId }: ListDetailsMainProps) {
  const { t } = useTranslation();
  const [mapVisible, setMapVisible] = useState(false);
  const [mapInitialIndex, setMapInitialIndex] = useState(0);
  const [savedStateOverride, setSavedStateOverride] = useState<{
    is_saved: boolean;
    saves: number;
  } | null>(null);

  useEffect(() => {
    setSavedStateOverride(null);
  }, [listId]);

  const {
    data: list,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["list-detail", listId],
    enabled: Boolean(listId),
    queryFn: async (): Promise<ListItemDAO | null> => {
      if (!listId) return null;
      const response = await listService.retrieveList(listId);
      return response.data?.data ?? null;
    },
  });

  const displayList =
    list && savedStateOverride != null
      ? {
          ...list,
          is_saved: savedStateOverride.is_saved,
          saves: savedStateOverride.saves,
        }
      : list;

  const mapPicksCount = displayList ? buildMapPicks(displayList).length : 0;

  const openMap = (pickIndex: number) => {
    if (!displayList) return;
    const picks = buildMapPicks(displayList);
    const mapIndex = picks.findIndex((pick) => pick.index === pickIndex);
    setMapInitialIndex(mapIndex >= 0 ? mapIndex : 0);
    setMapVisible(true);
  };

  if (!listId) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-gray-900">
        <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
          {t("listDetail.error")}
        </Text>
      </View>
    );
  }

  if (isPending) {
    return <PageLoader message={t("listDetail.loading")} />;
  }

  if (isError || !displayList) {
    return (
      <View className="flex-1 items-center justify-center bg-page px-6 dark:bg-gray-900">
        <Text className="mb-4 text-center font-geist text-base text-gray-500 dark:text-gray-400">
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
    );
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 bg-page dark:bg-gray-900"
    >
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ListDetailsHeader
          list={displayList}
          onSavedChange={(isSaved, saves) =>
            setSavedStateOverride({ is_saved: isSaved, saves })
          }
        />
        <ListDetailsBody list={displayList} onOpenInMaps={openMap} />
        <ListDetailsComments list={displayList} />
      </KeyboardAwareScrollView>

      {mapPicksCount > 0 ? (
        <Pressable
          onPress={() => openMap(0)}
          accessibilityRole="button"
          className="absolute bottom-8 right-3.5 z-10 flex-row items-center gap-1.5 rounded-full bg-ink px-3.5 py-2.5 shadow-lg cursor-pointer"
        >
          <MapPin size={13} color="#FFFFFF" />
          <Text className="font-geist-bold text-xs text-white">
            {t("listDetail.openAllInMap")}
          </Text>
        </Pressable>
      ) : null}

      <ListDetailsMap
        visible={mapVisible}
        list={displayList}
        initialIndex={mapInitialIndex}
        onClose={() => setMapVisible(false)}
      />
    </SafeAreaView>
  );
}
