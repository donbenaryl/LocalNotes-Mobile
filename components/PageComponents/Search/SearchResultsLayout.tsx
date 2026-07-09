import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import {
  SearchMap,
  type SearchMapMode,
} from "@/components/PageComponents/Search/SearchMap";
import {
  SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT,
  SEARCH_RESULTS_SHEET_EXPANDED_HEIGHT_RATIO,
  SEARCH_RESULTS_SHEET_MIN_EXPANDED_HEIGHT,
  SearchResultsSheet,
} from "@/components/PageComponents/Search/SearchResultsSheet";
import type { BusinessItemDAO } from "@/http/business-api/types";
import type { ListItemDAO } from "@/http/list-api/types";
import { Badge } from "@/components/ui/Badge";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";

type SearchResultsKind = "lists" | "places" | "people";
const SHEET_HEADER_CLEARANCE = 12;

interface SearchResultsLayoutProps<T> {
  mode: SearchMapMode;
  resultsKind: SearchResultsKind;
  listsForMap?: ListItemDAO[];
  businessesForMap?: BusinessItemDAO[];
  areaLabel?: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription?: string;
}

export function SearchResultsLayout<T>({
  mode,
  resultsKind,
  listsForMap = [],
  businessesForMap = [],
  areaLabel,
  data,
  keyExtractor,
  renderItem,
  isLoading,
  isPending,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
}: SearchResultsLayoutProps<T>) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const filterHeaderBottom = useSearchChromeStore((s) => s.filterHeaderBottom);
  const maxExpandedHeight = useMemo(() => {
    if (filterHeaderBottom === null) return undefined;

    return Math.max(
      windowHeight - filterHeaderBottom - SHEET_HEADER_CLEARANCE,
      SEARCH_RESULTS_SHEET_MIN_EXPANDED_HEIGHT,
    );
  }, [filterHeaderBottom, windowHeight]);
  const sheetOverlayHeight = useMemo(
    () =>
      isSheetCollapsed
        ? SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT
        : Math.max(
            maxExpandedHeight ??
              windowHeight * SEARCH_RESULTS_SHEET_EXPANDED_HEIGHT_RATIO,
            SEARCH_RESULTS_SHEET_MIN_EXPANDED_HEIGHT,
          ),
    [isSheetCollapsed, maxExpandedHeight, windowHeight],
  );

  const resultsLabel = areaLabel
    ? t("search.resultsMeta.inLocation", {
        count: data.length,
        location: areaLabel,
      })
    : t(`search.resultsMeta.${resultsKind}`, { count: data.length });

  return (
    <View className="flex-1">
      <View className="absolute inset-0">
        <SearchMap
          mode={mode}
          lists={listsForMap}
          businesses={businessesForMap}
          areaLabel={areaLabel}
          heightRatio={1}
          bottomOverlayHeight={sheetOverlayHeight}
        />
      </View>

      <SearchResultsSheet
        collapsedLabel={resultsLabel}
        onCollapsedChange={setIsSheetCollapsed}
        maxExpandedHeight={maxExpandedHeight}
      >
        <View
          pointerEvents={isSheetCollapsed ? "none" : "auto"}
          className="flex-1"
        >
          <Badge
            label={resultsLabel}
            className="ml-4 mb-4 -mt-2"
            variant="primary"
            size="md"
          />

          {isPending && data.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2 py-16">
              <ActivityIndicator size="large" color="#FF6B1A" />
              <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
                {t("search.loading")}
              </Text>
            </View>
          ) : error && data.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-3 px-6 py-16">
              <EmptyScreen title={t("search.error")} description={error} />
              <LocalNotesButton
                label={t("search.retry")}
                onPress={onRetry}
                variant="brand"
                size="xs"
                isRounded
                isWidthFull={false}
              />
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={keyExtractor}
              contentContainerClassName="gap-3 px-4 pb-28"
              showsVerticalScrollIndicator={false}
              scrollEnabled={!isSheetCollapsed}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading && data.length > 0}
                  onRefresh={onRetry}
                  tintColor="#FF6B1A"
                />
              }
              ListEmptyComponent={
                <EmptyScreen
                  title={emptyTitle}
                  description={
                    emptyDescription ?? t("search.empty.description")
                  }
                />
              }
              renderItem={({ item }) => (
                <View className="mb-1">{renderItem(item)}</View>
              )}
            />
          )}
        </View>
      </SearchResultsSheet>
    </View>
  );
}
