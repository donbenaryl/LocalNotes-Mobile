import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Slider } from "@/components/ui/Slider";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { FilterHeader } from "@/components/ui/FilterHeader";
import { QUESTION_GROUPS } from "@/constants/personality";
import {
  countFromMatchHistogramBins,
  useMatchHistogram,
  type MatchHistogramFilters,
  type MatchHistogramSurface,
} from "@/hooks/useMatchHistogram";
import { personalitySidesFromPriorities } from "@/utils/personalityQuiz";

const EMPTY_BINS: number[] = Array.from({ length: 20 }, () => 0);
const PRESETS: Array<number | null> = [null, 70, 85, 95];
const HISTOGRAM_MAX_HEIGHT = 60;
const AXIS_LABELS = ["0%", "25%", "50%", "75%", "100%"];
const SHEET_HEIGHT_RATIO = 0.85;
const FOOTER_CONTENT_PAD = 88;
const HISTOGRAM_PRIORITY_DEBOUNCE_MS = 2000;

export type PrioritySide = "left" | "right";
export type MatchPriorities = Record<number, PrioritySide>;

interface MatchThreshholdProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (threshold: number | null, priorities: MatchPriorities) => void;
  initialThreshold?: number | null;
  initialPriorities?: MatchPriorities;
  histogramSurface: MatchHistogramSurface;
  /** Location, vibes, query, etc. Personality sides are derived from draft priorities. */
  histogramFilters?: Omit<MatchHistogramFilters, "personalitySides">;
  /** Fallback count when bins are not yet available. */
  matchingCount?: number;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="font-geist-bold text-[10.5px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
      {label}
    </Text>
  );
}

function PresetChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <LocalNotesButton
      label={label}
      onPress={onPress}
      variant={isActive ? "dark" : "light"}
      size="xs"
      isRounded
      isWidthFull={false}
    />
  );
}

function PriorityChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-brand/45 bg-brand/15 px-2.5 py-1.5">
      <Text className="font-geist-bold text-[12.5px] text-brand">{label}</Text>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label}`}
      >
        <Text className="text-brand text-xs opacity-80">✕</Text>
      </Pressable>
    </View>
  );
}

function PrioritySegment({
  label,
  isActive,
  onPress,
  isFirst,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  isFirst?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 px-2 py-3 ${isFirst ? "border-r border-gray-200 dark:border-gray-700" : ""} ${
        isActive ? "bg-brand/15" : "bg-transparent"
      }`}
    >
      <Text
        className={`text-center text-[13.5px] leading-tight ${
          isActive
            ? "font-geist-bold text-brand"
            : "font-geist text-gray-500 dark:text-gray-400"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getPriorityLabel(questionId: number, side: PrioritySide): string {
  for (const group of QUESTION_GROUPS) {
    const item = group.items.find((q) => q.id === questionId);
    if (item) {
      return side === "right" ? item.rightLabel : item.leftLabel;
    }
  }
  return "";
}

function matchHistogramEntityLabel(
  surface: MatchHistogramSurface,
  count: number | undefined,
): string {
  if (surface === "people") return "people";

  const useSingular = count === 1;
  if (surface === "picks") return useSingular ? "pick" : "picks";
  return useSingular ? "list" : "lists";
}

export function MatchThreshhold({
  isVisible,
  onClose,
  onApply,
  initialThreshold,
  initialPriorities,
  histogramSurface,
  histogramFilters = {},
  matchingCount,
}: MatchThreshholdProps) {
  const { t } = useTranslation();
  const [localThreshold, setLocalThreshold] = useState<number | null>(
    initialThreshold ?? null
  );
  const [localPriorities, setLocalPriorities] = useState<MatchPriorities>(
    initialPriorities ?? {}
  );
  const [debouncedPriorities, setDebouncedPriorities] = useState<MatchPriorities>(
    initialPriorities ?? {}
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPriorityDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const scheduleHistogramRefresh = useCallback(
    (next: MatchPriorities) => {
      clearPriorityDebounce();
      debounceRef.current = setTimeout(() => {
        setDebouncedPriorities(next);
        debounceRef.current = null;
      }, HISTOGRAM_PRIORITY_DEBOUNCE_MS);
    },
    [clearPriorityDebounce]
  );

  useEffect(() => {
    if (isVisible) {
      const next = initialPriorities ?? {};
      setLocalThreshold(initialThreshold ?? null);
      setLocalPriorities(next);
      setDebouncedPriorities(next);
      clearPriorityDebounce();
    } else {
      clearPriorityDebounce();
    }
    return () => clearPriorityDebounce();
  }, [isVisible, initialThreshold, initialPriorities, clearPriorityDebounce]);

  const personalitySides = useMemo(
    () => personalitySidesFromPriorities(debouncedPriorities),
    [debouncedPriorities]
  );
  const histogramQueryFilters = useMemo(
    (): MatchHistogramFilters => ({
      ...histogramFilters,
      personalitySides,
    }),
    [histogramFilters, personalitySides]
  );
  const { bins: histogramBins } = useMatchHistogram(
    histogramSurface,
    histogramQueryFilters,
    isVisible
  );

  const sliderValue = localThreshold ?? 0;
  const histogramData =
    histogramBins && histogramBins.length === 20 ? histogramBins : EMPTY_BINS;
  const maxBarValue = Math.max(...histogramData, 1);
  const displayValue = localThreshold ?? 0;
  const liveMatchingCount =
    countFromMatchHistogramBins(histogramBins, localThreshold) ?? matchingCount;

  const selectedPriorityIds = useMemo(
    () =>
      Object.keys(localPriorities)
        .map(Number)
        .sort((a, b) => a - b),
    [localPriorities]
  );

  const handleSliderChange = (value: number) => {
    setLocalThreshold(value === 0 ? null : value);
  };

  const handleTogglePriority = (questionId: number, side: PrioritySide) => {
    setLocalPriorities((prev) => {
      const next = { ...prev };
      if (next[questionId] === side) {
        delete next[questionId];
      } else {
        next[questionId] = side;
      }
      scheduleHistogramRefresh(next);
      return next;
    });
  };

  const handleRemovePriority = (questionId: number) => {
    setLocalPriorities((prev) => {
      const next = { ...prev };
      delete next[questionId];
      scheduleHistogramRefresh(next);
      return next;
    });
  };

  const handleReset = () => {
    setLocalThreshold(null);
    setLocalPriorities({});
    scheduleHistogramRefresh({});
  };

  const handleApply = () => {
    const threshold = localThreshold === 0 ? null : localThreshold;
    onApply(threshold, localPriorities);
    onClose();
  };

  const isPresetActive = (preset: number | null) => {
    if (preset === null) return localThreshold === null || localThreshold === 0;
    return localThreshold === preset;
  };

  const priorityNames = selectedPriorityIds.map((id) =>
    getPriorityLabel(id, localPriorities[id])
  );
  const footerMatchLabel =
    displayValue === 0 ? "any match" : `match ${displayValue}%+`;
  const footerPrioritySuffix =
    priorityNames.length > 0 ? ` · ${priorityNames.join(" + ")}` : "";
  const footerEntityLabel = matchHistogramEntityLabel(
    histogramSurface,
    liveMatchingCount,
  );

  return (
    <Modal
      visible={isVisible}
      onClose={onClose}
      sheetHeightRatio={SHEET_HEIGHT_RATIO}
      footer={
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-sm text-ink dark:text-gray-100">
            <Text className="font-geist-bold">
              {liveMatchingCount !== undefined ? liveMatchingCount : "—"}{" "}
              {footerEntityLabel}
            </Text>
            {" · "}
            {footerMatchLabel}
            {footerPrioritySuffix}
          </Text>
          <View className="justify-center">
            <LocalNotesButton
              label="Apply →"
              onPress={handleApply}
              variant="dark"
              isRounded
              size="sm"
              isWidthFull={false}
            />
          </View>
        </View>
      }
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: FOOTER_CONTENT_PAD }}
        keyboardShouldPersistTaps="handled"
      >
        <FilterHeader
          title="Match"
          accentTitle="threshold."
          actionLabel="Reset"
          onAction={handleReset}
        />

        <SectionLabel label="Overall match" />

        {/* Big number display */}
        <View className="items-center mb-5 mt-1">
          <View className="flex-row items-end">
            <Text className="font-geist-bold text-7xl pt-1 text-brand leading-none">
              {displayValue}
            </Text>
            <Text className="font-geist text-2xl text-gray-400 mb-2 ml-0.5">%</Text>
          </View>
          <Text className="italic text-sm text-gray-500 dark:text-gray-400 mt-1">
            match or higher
          </Text>
        </View>

        {/* Preset chips */}
        <View className="flex-row gap-2 justify-center mb-6">
          {PRESETS.map((preset) => {
            const label = preset === null ? "Any" : `${preset}%+`;
            return (
              <PresetChip
                key={label}
                label={label}
                isActive={isPresetActive(preset)}
                onPress={() => setLocalThreshold(preset)}
              />
            );
          })}
        </View>

        {/* Histogram */}
        <View
          className="flex-row items-end gap-0.5 mb-1"
          style={{ height: HISTOGRAM_MAX_HEIGHT }}
        >
          {histogramData.map((value, index) => {
            const bucketStart = index * 5;
            const isActive = bucketStart >= sliderValue && sliderValue > 0;
            const barHeight = Math.round((value / maxBarValue) * HISTOGRAM_MAX_HEIGHT);
            return (
              <View
                key={index}
                className={`flex-1 rounded-sm ${isActive ? "bg-brand" : "bg-gray-200 dark:bg-gray-700"}`}
                style={{ height: Math.max(barHeight, 4) }}
              />
            );
          })}
        </View>

        {/* Slider */}
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          colors={["#D1D5DB", "#FF6B1A"]}
          min={0}
          max={100}
          step={5}
          thumbBorderColor="#FF6B1A"
          containerClassName="mb-1"
        />

        {/* Axis labels */}
        <View className="flex-row justify-between mb-3">
          {AXIS_LABELS.map((label) => (
            <Text key={label} className="text-xs text-gray-400 dark:text-gray-500">
              {label}
            </Text>
          ))}
        </View>

        {/* Helper text */}
        <Text className="italic text-xs text-gray-400 dark:text-gray-500 text-center mb-4">
          Drag to set any threshold. Snaps to every 5%.
        </Text>

        <View className="h-px bg-gray-200 dark:bg-gray-700 mb-1" />

        {/* Priorities */}
        <View className="flex-row items-baseline justify-between mt-3 mb-1">
          <SectionLabel label="Priorities" />
          <Text className="text-[11px] font-geist-medium text-gray-400 dark:text-gray-500">
            optional
          </Text>
        </View>
        <Text className="text-[12.5px] leading-5 text-gray-500 dark:text-gray-400 mb-3">
          Also require they lean the same way on the things you care about — even
          at a low overall match. Tap a side.
        </Text>

        {selectedPriorityIds.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {selectedPriorityIds.map((id) => (
              <PriorityChip
                key={id}
                label={getPriorityLabel(id, localPriorities[id])}
                onRemove={() => handleRemovePriority(id)}
              />
            ))}
          </View>
        ) : null}

        {QUESTION_GROUPS.map((group) => (
          <View key={group.sectionKey} className="mb-1">
            <Text className="font-geist-bold text-[10px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500 mt-3 mb-2">
              {t(`personality.sections.${group.sectionKey}`)}
            </Text>
            {group.items.map((item) => {
              const selected = localPriorities[item.id];
              return (
                <View
                  key={item.id}
                  className="mb-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"
                >
                  <View className="flex-row">
                    <PrioritySegment
                      label={item.leftLabel}
                      isActive={selected === "left"}
                      onPress={() => handleTogglePriority(item.id, "left")}
                      isFirst
                    />
                    <PrioritySegment
                      label={item.rightLabel}
                      isActive={selected === "right"}
                      onPress={() => handleTogglePriority(item.id, "right")}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Modal>
  );
}
