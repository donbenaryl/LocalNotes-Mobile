import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import listService from "@/http/list-api/list.service";
import { buildMapPicks } from "@/utils/listPickLocation";
import { ListDetailsHeader } from "./ListDetailsHeader";
import { ListDetailsBody } from "./ListDetailsBody";
import { ListDetailsMap } from "./ListDetailsMap";
import { ListDetailsSkeleton } from "./ListDetailsSkeleton";
import type { ListItemDAO } from "@/http/list-api/types";
import type { ViewOrigin } from "@/http/types";

/** Sheet wraps content; scroll when taller than this fraction of the window. */
const SHEET_MAX_HEIGHT_RATIO = 0.55;

interface ListDetailsMainProps {
  listId?: string;
  /** When set (e.g. inside ListDetailModal), back dismisses instead of router.back(). */
  onClose?: () => void;
  viewOrigin: ViewOrigin;
}

export function ListDetailsMain({
  listId,
  onClose,
  viewOrigin,
}: ListDetailsMainProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const sheetMaxHeight = height * SHEET_MAX_HEIGHT_RATIO;
  const [mapVisible, setMapVisible] = useState(false);
  const [mapInitialIndex, setMapInitialIndex] = useState(0);

  const {
    data: list,
    isPending,
    isError,
    isRefetching,
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

  const viewedListIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!listId || !list) return;
    if (viewedListIdRef.current === listId) return;
    viewedListIdRef.current = listId;
    void listService.viewList(listId, {
      source: "mobile",
      origin: viewOrigin,
    });
  }, [listId, list, viewOrigin]);

  const mapPicksCount = list ? buildMapPicks(list).length : 0;

  const openMap = (pickIndex: number) => {
    if (!list) return;
    const picks = buildMapPicks(list);
    const mapIndex = picks.findIndex((pick) => pick.index === pickIndex);
    setMapInitialIndex(mapIndex >= 0 ? mapIndex : 0);
    setMapVisible(true);
  };

  if (!listId) {
    return (
      <View className="items-center justify-center bg-page px-6 py-16 dark:bg-gray-900">
        <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
          {t("listDetail.error")}
        </Text>
      </View>
    );
  }

  if (isPending) {
    return <ListDetailsSkeleton />;
  }

  if (isError || !list) {
    return (
      <View className="items-center justify-center bg-page px-6 py-16 dark:bg-gray-900">
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
    <SafeAreaView edges={["bottom"]} className="">
      <KeyboardAwareScrollView
        style={{ maxHeight: sheetMaxHeight }}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <AppRefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
        }
      >
        <ListDetailsHeader list={list} onClose={onClose} />
        <ListDetailsBody list={list} viewOrigin={viewOrigin} />
      </KeyboardAwareScrollView>

      {/* {mapPicksCount > 0 ? (
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
      ) : null} */}

      <ListDetailsMap
        visible={mapVisible}
        list={list}
        initialIndex={mapInitialIndex}
        onClose={() => setMapVisible(false)}
      />
    </SafeAreaView>
  );
}
