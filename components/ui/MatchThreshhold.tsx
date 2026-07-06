import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Slider } from "@/components/ui/Slider";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { FilterHeader } from "@/components/ui/FilterHeader";

const DEFAULT_HISTOGRAM: number[] = [2, 3, 4, 5, 7, 9, 11, 13, 15, 16, 14, 12, 10, 8, 7, 5, 4, 3, 2, 1];
const PRESETS: Array<number | null> = [null, 70, 85, 95];
const HISTOGRAM_MAX_HEIGHT = 60;
const AXIS_LABELS = ["0%", "25%", "50%", "75%", "100%"];

interface MatchThreshholdProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (threshold: number | null) => void;
  initialThreshold?: number | null;
  histogramData?: number[];
  matchingCount?: number;
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

export function MatchThreshhold({
  isVisible,
  onClose,
  onApply,
  initialThreshold,
  histogramData = DEFAULT_HISTOGRAM,
  matchingCount,
}: MatchThreshholdProps) {
  const [localThreshold, setLocalThreshold] = useState<number | null>(
    initialThreshold ?? null
  );

  useEffect(() => {
    if (isVisible) {
      setLocalThreshold(initialThreshold ?? null);
    }
  }, [isVisible, initialThreshold]);

  const sliderValue = localThreshold ?? 0;
  const maxBarValue = Math.max(...histogramData, 1);

  const handleSliderChange = (value: number) => {
    setLocalThreshold(value === 0 ? null : value);
  };

  const handleApply = () => {
    const threshold = localThreshold === 0 ? null : localThreshold;
    onApply(threshold);
    onClose();
  };

  const isPresetActive = (preset: number | null) => {
    if (preset === null) return localThreshold === null || localThreshold === 0;
    return localThreshold === preset;
  };

  const displayValue = localThreshold ?? 0;

  return (
    <Modal visible={isVisible} onClose={onClose}>
      <FilterHeader
        title="Match"
        accentTitle="threshold."
        actionLabel="Reset"
        onAction={() => setLocalThreshold(null)}
      />

      {/* Big number display */}
      <View className="items-center mb-5">
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
      <View className="flex-row items-end gap-0.5 mb-1" style={{ height: HISTOGRAM_MAX_HEIGHT }}>
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
      <Text className="italic text-xs text-gray-400 dark:text-gray-500 text-center mb-6">
        Drag to set any threshold. Snaps to every 5%.
      </Text>

      {/* Footer */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-ink dark:text-gray-100">
          <Text className="font-geist-bold">
            {matchingCount !== undefined ? matchingCount : "—"} lists
          </Text>
          {" "}match {displayValue}%+
        </Text>
        <LocalNotesButton
          label="Apply →"
          onPress={handleApply}
          variant="dark"
          isRounded
          size="sm"
          isWidthFull={false}
        />
      </View>
    </Modal>
  );
}
