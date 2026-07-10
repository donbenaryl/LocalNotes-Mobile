import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronDown, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";
import { LocationInputModalTrigger } from "@/components/ui/LocationInputModal";
import type { Location as GeoLocation } from "@/http/list-api/types";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { MatchThreshhold } from "@/components/ui/MatchThreshhold";
import { Toggle } from "@/components/ui/Toggle";
import { VibeFilterModal } from "@/components/ui/VibeFilter";
import type { HomeContentType } from "@/utils/homePicks";

export type { HomeContentType };

export type HomeListFilter = "personality_match" | "vibe" | "distance" | "newest";

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
  onMatchThresholdChange?: (threshold: number | null) => void;
  matchingCount?: number;
  selectedVibes?: string[];
  onVibesChange?: (vibes: string[]) => void;
  vibeMatchCount?: number;
  contentType: HomeContentType;
  onContentTypeChange: (type: HomeContentType) => void;
}

const FILTER_OPTIONS: HomeListFilter[] = [
  "personality_match",
  "vibe",
  "distance",
  "newest",
];

const FILTER_LABEL_KEYS: Record<HomeListFilter, string> = {
  personality_match: "home.filters.personalityMatch",
  vibe: "home.filters.vibe",
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
  onMatchThresholdChange,
  matchingCount,
  selectedVibes = [],
  onVibesChange,
  vibeMatchCount,
  contentType,
  onContentTypeChange,
}: HomeFilterHeaderProps) {
  const { t } = useTranslation();
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);

  return (
    <View className="mb-4 mt-2">
      <View className="mb-3.5 flex-row items-center">
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
            <Text className="mx-1 text-gray-400">·</Text>
            <Text className="font-geist-medium text-ink dark:text-gray-100">
              {timeLabel}
            </Text>
          </>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row items-center gap-1.5"
      >
        <Toggle
          value={contentType}
          onChange={onContentTypeChange}
          options={[
            { value: "lists", label: t("home.contentType.lists") },
            { value: "picks", label: t("home.contentType.picks") },
          ]}
        />
        {FILTER_OPTIONS.map((filter) => (
          <LocalNotesButton
            key={filter}
            label={t(FILTER_LABEL_KEYS[filter])}
            onPress={() => {
              if (filter === "personality_match") {
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
        matchingCount={matchingCount}
        onApply={(threshold) => {
          onMatchThresholdChange?.(threshold);
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
    </View>
  );
}
