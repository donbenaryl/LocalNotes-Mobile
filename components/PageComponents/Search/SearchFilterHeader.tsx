import { type ComponentRef, useCallback, useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  ScrollView,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { LocationInputModalTrigger } from "@/components/ui/LocationInputModal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import {
  MatchThreshhold,
  type MatchPriorities,
} from "@/components/ui/MatchThreshhold";
import { VibeFilterModal } from "@/components/ui/VibeFilter";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { type MatchHistogramSurface } from "@/hooks/useMatchHistogram";
import { useEffectiveSearchLocation } from "@/hooks/useEffectiveSearchLocation";
import { useSearchStore } from "@/stores/useSearchStore";

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
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  const committedQuery = useSearchStore((s) => s.committedQuery);
  const coordinates = useEffectiveSearchLocation();

  const histogramFilters = useMemo(
    () => ({
      query: committedQuery || undefined,
      vibes: selectedVibes,
      ...(coordinates
        ? {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            city: coordinates.city,
            region: coordinates.region,
            radiusKm: DEFAULT_RADIUS_KM,
          }
        : {}),
    }),
    [committedQuery, selectedVibes, coordinates],
  );

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (!onMeasuredBottomChange) return;

      requestAnimationFrame(() => {
        containerRef.current?.measureInWindow((_x, y, _width, height) => {
          onMeasuredBottomChange(y + height);
        });
      });
    },
    [onMeasuredBottomChange],
  );

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

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      className={`gap-3 px-4 pt-3 ${className}`}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-1.5"
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
