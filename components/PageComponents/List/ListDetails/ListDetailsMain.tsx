import { useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import listService from "@/http/list-api/list.service";
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
  /** When false, the detail query stays idle (modal closed). Defaults to true. */
  visible?: boolean;
  /** Seed cache so first open can paint without waiting on retrieveList. */
  initialList?: ListItemDAO | null;
}

export function ListDetailsMain({
  listId,
  onClose,
  viewOrigin,
  visible = true,
  initialList = null,
}: ListDetailsMainProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  // Guard against a 0 window size on first Modal presentation.
  const sheetMaxHeight = Math.max(height, 1) * SHEET_MAX_HEIGHT_RATIO;
  const [mapVisible, setMapVisible] = useState(false);
  const mapInitialIndex = 0;

  const placeholderList =
    initialList && listId && initialList.id === listId ? initialList : undefined;

  const {
    data: list,
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["list-detail", listId],
    enabled: visible && Boolean(listId),
    placeholderData: placeholderList,
    queryFn: async (): Promise<ListItemDAO | null> => {
      if (!listId) return null;
      const response = await listService.retrieveList(listId);
      return response.data?.data ?? null;
    },
  });

  const viewedListIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible || !listId || !list) return;
    if (viewedListIdRef.current === listId) return;
    viewedListIdRef.current = listId;
    void listService.viewList(listId, {
      source: "mobile",
      origin: viewOrigin,
    });
  }, [visible, listId, list, viewOrigin]);

  // Keep one ScrollView mounted for the whole open so skeleton → content
  // does not remount the sheet body (which collapses wrap-content Modals).
  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: sheetMaxHeight, minHeight: 120 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        // RefreshControl blanks flex ScrollViews on Android.
        refreshControl={
          Platform.OS === "android" ? undefined : (
            <AppRefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
            />
          )
        }
      >
        {!listId ? (
          <View className="items-center justify-center px-6 py-16">
            <Text className="font-geist text-base text-gray-500 dark:text-gray-400">
              {t("listDetail.error")}
            </Text>
          </View>
        ) : isPending && !list ? (
          <ListDetailsSkeleton />
        ) : isError || !list ? (
          <View className="items-center justify-center px-6 py-16">
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
        ) : (
          <>
            <ListDetailsHeader list={list} onClose={onClose} />
            <ListDetailsBody list={list} viewOrigin={viewOrigin} />
          </>
        )}
      </ScrollView>

      {list ? (
        <ListDetailsMap
          visible={mapVisible}
          list={list}
          initialIndex={mapInitialIndex}
          onClose={() => setMapVisible(false)}
        />
      ) : null}
    </>
  );
}
