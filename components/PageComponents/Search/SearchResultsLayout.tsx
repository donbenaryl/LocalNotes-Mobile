import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useTranslation } from "react-i18next";
import { EmptyScreen } from "@/components/ui/EmptyScreen";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { SpinLoader } from "@/components/ui/SpinLoader";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
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
import type { ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import type { UnifiedSearchPersonDAO } from "@/http/search-api/type";
import { Badge } from "@/components/ui/Badge";
import { useScrollToTopControl } from "@/hooks/useScrollToTopControl";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";

type SearchResultsKind = "lists" | "places" | "people" | "picks";
const SHEET_HEADER_CLEARANCE = 12;

interface SearchResultsLayoutProps<T> {
  mode: SearchMapMode;
  resultsKind: SearchResultsKind;
  listsForMap?: ListItemDAO[];
  businessesForMap?: BusinessItemDAO[];
  picksForMap?: ListItemPublic[];
  peopleForMap?: UnifiedSearchPersonDAO[];
  areaLabel?: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem?: (item: T) => ReactNode;
  /** Overrides the default single-column FlatList body (e.g. a masonry grid). Still gated by the same isPending/error/data-length states below. */
  renderBody?: (
    data: T[],
    pagination: {
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
      listFooter: ReactNode;
    },
  ) => ReactNode;
  /** Total matching results from the API; falls back to loaded `data.length` when omitted. */
  totalCount?: number;
  isLoading: boolean;
  isPending: boolean;
  isRefetching?: boolean;
  error: string | null;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function SearchResultsLayout<T>({
  mode,
  resultsKind,
  listsForMap = [],
  businessesForMap = [],
  picksForMap,
  peopleForMap,
  areaLabel,
  data,
  keyExtractor,
  renderItem,
  renderBody,
  totalCount,
  isPending,
  isRefetching = false,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  onLoadMore,
  hasNextPage = false,
  isFetchingNextPage = false,
}: SearchResultsLayoutProps<T>) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const listRef = useRef<FlatList<T>>(null);
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(listRef);
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

  const resultCount = totalCount ?? data.length;
  const resultsLabel = areaLabel
    ? t("search.resultsMeta.inLocation", {
        count: resultCount,
        location: areaLabel,
      })
    : t(`search.resultsMeta.${resultsKind}`, { count: resultCount });

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage && onLoadMore) {
      onLoadMore();
    }
  };

  const handleScrollNearEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const { layoutMeasurement, contentOffset, contentSize } =
      event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 200) {
      handleEndReached();
    }
  };

  const listFooter = isFetchingNextPage ? <SpinLoader /> : null;

  return (
    <View className="flex-1">
      <View className="absolute inset-0">
        <SearchMap
          mode={mode}
          lists={listsForMap}
          businesses={businessesForMap}
          picks={picksForMap}
          people={peopleForMap}
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
            <View className="flex-1">
              {renderBody ? (
                renderBody(data, {
                  onScroll: handleScrollNearEnd,
                  listFooter,
                })
              ) : (
                <>
                  <FlatList
                    ref={listRef}
                    data={data}
                    keyExtractor={keyExtractor}
                    contentContainerClassName="gap-3 px-4 pb-28"
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={!isSheetCollapsed}
                    scrollEventThrottle={16}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.4}
                    onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                      onScrollY(event.nativeEvent.contentOffset.y);
                    }}
                    refreshControl={
                      <AppRefreshControl
                        refreshing={isRefetching}
                        onRefresh={onRetry}
                      />
                    }
                    ListFooterComponent={listFooter}
                    ListEmptyComponent={
                      <EmptyScreen
                        title={emptyTitle}
                        description={
                          emptyDescription ?? t("search.empty.description")
                        }
                      />
                    }
                    renderItem={({ item }) => (
                      <View className="mb-1">{renderItem?.(item)}</View>
                    )}
                  />
                  <ScrollToTopButton visible={visible} onPress={scrollToTop} />
                </>
              )}
            </View>
          )}
        </View>
      </SearchResultsSheet>
    </View>
  );
}
