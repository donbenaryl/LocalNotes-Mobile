import {
  type ComponentRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  InteractionManager,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ListFilter } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { LocationInputModalTrigger } from "@/components/ui/LocationInputModal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import {
  MatchThreshhold,
  type MatchPriorities,
} from "@/components/ui/MatchThreshhold";
import { VibeFilterModal } from "@/components/ui/VibeFilter";
import { AdvancedSearchSheet } from "@/components/PageComponents/Search/AdvancedSearchSheet";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { type MatchHistogramSurface } from "@/hooks/useMatchHistogram";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import { useSearchStore } from "@/stores/useSearchStore";
import { countActiveAdvancedFilters } from "@/utils/searchAdvancedFilters";

const DEFAULT_RADIUS_KM = 15;

interface SearchFilterHeaderProps {
  cityLabel: string;
  isAllLocations?: boolean;
  onCitySelected: (location: GeoLocation) => void;
  onAllSelected?: () => void;
  matchThreshold: number | null;
  matchPriorities?: MatchPriorities;
  onMatchApply: (
    threshold: number | null,
    priorities: MatchPriorities
  ) => void;
  matchingCount?: number;
  selectedVibes: string[];
  onVibesChange: (vibes: string[]) => void;
  vibeMatchCount?: number;
  /** Active search tab that owns the match sheet histogram. */
  histogramSurface?: MatchHistogramSurface;
  /** Hide match/vibe chips on Places tab (handoff uses Open now there). */
  showMatchFilter?: boolean;
  showVibeFilter?: boolean;
  className?: string;
  onMeasuredBottomChange?: (bottom: number) => void;
}

export function SearchFilterHeader({
  cityLabel,
  isAllLocations = true,
  onCitySelected,
  onAllSelected,
  matchThreshold,
  matchPriorities,
  onMatchApply,
  matchingCount,
  selectedVibes,
  onVibesChange,
  vibeMatchCount,
  histogramSurface = "lists",
  showMatchFilter = true,
  showVibeFilter = true,
  className = "",
  onMeasuredBottomChange,
}: SearchFilterHeaderProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  const rafRef = useRef<number | null>(null);
  const interactionHandleRef = useRef<{ cancel: () => void } | null>(null);
  const anyModalOpen =
    isMatchModalOpen || isVibeModalOpen || isAdvancedOpen;
  const anyModalOpenRef = useRef(anyModalOpen);
  anyModalOpenRef.current = anyModalOpen;

  const committedQuery = useSearchStore((s) => s.committedQuery);
  const distanceMiles = useSearchStore((s) => s.distanceMiles);
  const selectedCategories = useSearchStore((s) => s.selectedCategories);
  const followingOnly = useSearchStore((s) => s.followingOnly);
  const sort = useSearchStore((s) => s.sort);
  const coordinates = useEffectiveSearchLocation();

  const advancedActiveCount = countActiveAdvancedFilters({
    distanceMiles,
    selectedCategories,
    followingOnly,
    sort,
  });

  const histogramFilters = useMemo(() => {
    const locationFilters = (() => {
      if (!coordinates) return {};

      // People search prefers city/region when set (backend city mode wins).
      if (histogramSurface === "people") {
        if (coordinates.city) {
          return {
            city: coordinates.city,
            ...(coordinates.region ? { region: coordinates.region } : {}),
          };
        }
        return {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radiusKm: DEFAULT_RADIUS_KM,
        };
      }

      // Lists/picks search only send lat/lng radius — omit city/region so the
      // histogram pool matches the feed (city params would win on the backend).
      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radiusKm: DEFAULT_RADIUS_KM,
      };
    })();

    return {
      query: committedQuery || undefined,
      vibes: selectedVibes,
      ...locationFilters,
    };
  }, [committedQuery, selectedVibes, coordinates, histogramSurface]);

  const cancelPendingMeasure = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    interactionHandleRef.current?.cancel();
    interactionHandleRef.current = null;
  }, []);

  const reportMeasuredBottom = useCallback(() => {
    if (!onMeasuredBottomChange || anyModalOpenRef.current) return;
    const node = containerRef.current;
    if (!node) return;

    node.measureInWindow((_x, y, _width, height) => {
      // Modal may have opened (or the view detached) before the native callback.
      if (!containerRef.current || anyModalOpenRef.current) return;
      onMeasuredBottomChange(y + height);
    });
  }, [onMeasuredBottomChange]);

  const scheduleMeasure = useCallback(() => {
    if (!onMeasuredBottomChange || anyModalOpenRef.current) return;

    cancelPendingMeasure();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      reportMeasuredBottom();
    });
  }, [cancelPendingMeasure, onMeasuredBottomChange, reportMeasuredBottom]);

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      scheduleMeasure();
    },
    [scheduleMeasure],
  );

  // Remeasure after filter modals finish dismissing so sheet height stays correct
  // without racing Fabric teardown of the native modal hierarchy.
  useEffect(() => {
    if (anyModalOpen) {
      cancelPendingMeasure();
      return;
    }
    if (!onMeasuredBottomChange) return;

    cancelPendingMeasure();
    interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
      interactionHandleRef.current = null;
      reportMeasuredBottom();
    });

    return () => {
      cancelPendingMeasure();
    };
  }, [
    anyModalOpen,
    cancelPendingMeasure,
    onMeasuredBottomChange,
    reportMeasuredBottom,
  ]);

  useEffect(() => {
    return () => {
      cancelPendingMeasure();
    };
  }, [cancelPendingMeasure]);

  const hasMatchPriorities = Object.keys(matchPriorities ?? {}).length > 0;
  const isMatchActive = matchThreshold !== null || hasMatchPriorities;

  const matchLabel =
    matchThreshold !== null
      ? t("search.filters.matchValue", { percent: matchThreshold })
      : t("search.filters.match");

  const vibeLabel =
    selectedVibes.length > 0
      ? t("search.filters.vibeValue", {
          labels: selectedVibes.slice(0, 2).join(", "),
        })
      : t("search.filters.vibe");

  const iconColor = colorScheme === "dark" ? "#F5F1E8" : "#1A1714";

  return (
    <View
      ref={containerRef}
      collapsable={false}
      onLayout={handleLayout}
      className={`gap-3 px-4 pt-3 ${className}`}
    >
      <View className="w-full flex-row items-center gap-1.5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 1, flexShrink: 1 }}
          contentContainerClassName="flex-row items-center gap-1.5 pr-1"
        >
          <LocationInputModalTrigger
            cityLabel={cityLabel}
            isAllSelected={isAllLocations}
            onLocationSelected={onCitySelected}
            onAllSelected={onAllSelected}
          />
          {showVibeFilter ? (
            <LocalNotesButton
              label={vibeLabel}
              onPress={() => setIsVibeModalOpen(true)}
              variant={selectedVibes.length > 0 ? "dark" : "light"}
              size="xs"
              isRounded
              isWidthFull={false}
            />
          ) : null}
          {showMatchFilter ? (
            <LocalNotesButton
              label={matchLabel}
              onPress={() => setIsMatchModalOpen(true)}
              variant={isMatchActive ? "dark" : "light"}
              size="xs"
              isRounded
              isWidthFull={false}
            />
          ) : null}
        </ScrollView>

        <Pressable
          onPress={() => setIsAdvancedOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={
            advancedActiveCount > 0
              ? t("search.filters.advancedA11yActive", {
                  count: advancedActiveCount,
                })
              : t("search.filters.advancedA11y")
          }
          className={`relative h-8 w-9 shrink-0 items-center justify-center rounded-lg border cursor-pointer ${
            advancedActiveCount > 0
              ? "border-brand bg-brand/10 dark:border-dk-text dark:bg-dk-elevated"
              : "border-gray-200 bg-card dark:border-dk-border dark:bg-dk-card"
          }`}
        >
          <ListFilter size={17} color={iconColor} />
          {advancedActiveCount > 0 ? (
            <View className="absolute -right-1.5 -top-1.5 min-w-[16px] items-center rounded-full bg-brand px-1 dark:bg-gray-100">
              <Text className="font-geist-bold text-[10px] text-white dark:text-ink">
                {advancedActiveCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <MatchThreshhold
        isVisible={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        initialThreshold={matchThreshold}
        initialPriorities={matchPriorities}
        histogramSurface={histogramSurface}
        histogramFilters={histogramFilters}
        matchingCount={matchingCount}
        onApply={(threshold, priorities) => {
          onMatchApply(threshold, priorities);
          setIsMatchModalOpen(false);
        }}
      />

      <AdvancedSearchSheet
        isVisible={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        matchingCount={matchingCount}
      />

      <VibeFilterModal
        isVisible={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        selectedVibes={selectedVibes}
        onVibesChange={onVibesChange}
        matchCount={vibeMatchCount}
      />
    </View>
  );
}
