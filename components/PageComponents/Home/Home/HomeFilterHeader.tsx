import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronDown, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";
import { LocationInputModalTrigger } from "@/components/ui/LocationInputModal";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { CategoryFilterModal } from "@/components/ui/CategoryFilterModal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import {
  MatchThreshhold,
  type MatchPriorities,
} from "@/components/ui/MatchThreshhold";
import { Toggle } from "@/components/ui/Toggle";
import { VibeFilterModal } from "@/components/ui/VibeFilter";
import type { HomeContentType } from "@/utils/homePicks";
import {
  useMatchHistogram,
  type MatchHistogramFilters,
} from "@/hooks/useMatchHistogram";
import { personalitySidesFromPriorities } from "@/utils/personalityQuiz";

export type { HomeContentType };

export type HomeListFilter =
  | "category"
  | "personality_match"
  | "vibe"
  | "distance"
  | "newest";

interface HomeFilterHeaderProps {
  cityLabel: string;
  timeLabel: string;
  activeFilters: HomeListFilter[];
  onFilterChange: (filter: HomeListFilter) => void;
  onCitySelected: (location: GeoLocation) => void;
  onAllSelected?: () => void;
  isAllLocations?: boolean;
  isCityLoading?: boolean;
  matchThreshold?: number | null;
  matchPriorities?: MatchPriorities;
  onMatchApply?: (
    threshold: number | null,
    priorities: MatchPriorities
  ) => void;
  matchingCount?: number;
  selectedVibes?: string[];
  onVibesChange?: (vibes: string[]) => void;
  vibeMatchCount?: number;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
  categoryMatchCount?: number;
  contentType: HomeContentType;
  onContentTypeChange: (type: HomeContentType) => void;
  /** Location / radius for the match histogram (omit when browsing all locations). */
  histogramLocation?: Pick<
    MatchHistogramFilters,
    "latitude" | "longitude" | "city" | "region" | "radiusKm"
  > | null;
}

const FILTER_OPTIONS: HomeListFilter[] = [
  "personality_match",
  "vibe",
  "category",
  "distance",
  "newest",
];

const FILTER_LABEL_KEYS: Record<HomeListFilter, string> = {
  personality_match: "home.filters.personalityMatch",
  vibe: "home.filters.vibe",
  category: "home.filters.category",
  distance: "home.filters.distance",
  newest: "home.filters.newest",
};

interface SortChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function HomeFilterHeader({
  cityLabel,
  timeLabel,
  activeFilters,
  onFilterChange,
  onCitySelected,
  onAllSelected,
  isAllLocations = true,
  isCityLoading = false,
  matchThreshold,
  matchPriorities,
  onMatchApply,
  matchingCount,
  selectedVibes = [],
  onVibesChange,
  vibeMatchCount,
  selectedCategories = [],
  onCategoriesChange,
  categoryMatchCount,
  contentType,
  onContentTypeChange,
  histogramLocation = null,
}: HomeFilterHeaderProps) {
  const { t } = useTranslation();
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const histogramSurface = contentType === "picks" ? "picks" : "lists";
  const histogramFilters = useMemo(
    (): MatchHistogramFilters => ({
      vibes: selectedVibes,
      personalitySides: personalitySidesFromPriorities(matchPriorities ?? {}),
      categoryIds: selectedCategories,
      ...(histogramLocation ?? {}),
    }),
    [selectedVibes, matchPriorities, selectedCategories, histogramLocation],
  );
  const { bins: histogramBins } = useMatchHistogram(
    histogramSurface,
    histogramFilters,
    isMatchModalOpen,
  );

  return (
    <View className="mb-4">
      <View className="mb-3.5 flex-row items-center justify-between">
        <Toggle
          value={contentType}
          onChange={onContentTypeChange}
          options={[
            { value: "lists", label: t("home.contentType.lists") },
            { value: "picks", label: t("home.contentType.picks") },
          ]}
        />
        {isCityLoading ? (
          <>
            <MapPin size={13} color="#6B7280" />
            <Skeleton className="ml-1 h-4 w-24 rounded-lg" />
            <View className="ml-0.5 opacity-55">
              <ChevronDown size={9} color="#6B7280" />
            </View>
            <Text className="mx-1 text-xs text-gray-400">·</Text>
            <Text className="font-geist-medium text-xs text-ink dark:text-gray-100">
              {timeLabel}
            </Text>
          </>
        ) : (
          <>
            <LocationInputModalTrigger
              cityLabel={cityLabel}
              isAllSelected={isAllLocations}
              onLocationSelected={onCitySelected}
              onAllSelected={onAllSelected}
            />
          </>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-1.5"
      >
        {FILTER_OPTIONS.map((filter) => (
          <LocalNotesButton
            key={filter}
            label={t(FILTER_LABEL_KEYS[filter])}
            onPress={() => {
              if (filter === "category") {
                setIsCategoryModalOpen(true);
              } else if (filter === "personality_match") {
                setIsMatchModalOpen(true);
              } else if (filter === "vibe") {
                setIsVibeModalOpen(true);
              } else {
                onFilterChange(filter);
              }
            }}
            variant={activeFilters.includes(filter) ? "dark" : "light"}
            size="xs"
            isRounded
            isWidthFull={false}
          />
        ))}
      </ScrollView>

      <MatchThreshhold
        isVisible={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        initialThreshold={matchThreshold}
        initialPriorities={matchPriorities}
        histogramBins={histogramBins}
        matchingCount={matchingCount}
        onApply={(threshold, priorities) => {
          onMatchApply?.(threshold, priorities);
          setIsMatchModalOpen(false);
        }}
      />

      <VibeFilterModal
        isVisible={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        selectedVibes={selectedVibes}
        onVibesChange={(vibes) => {
          onVibesChange?.(vibes);
        }}
        matchCount={vibeMatchCount}
      />

      <CategoryFilterModal
        isVisible={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        selectedCategories={selectedCategories}
        onCategoriesChange={(categories) => {
          onCategoriesChange?.(categories);
        }}
        matchCount={categoryMatchCount}
      />
    </View>
  );
}
