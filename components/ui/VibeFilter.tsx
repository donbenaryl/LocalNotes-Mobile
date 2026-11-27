import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterHeader } from "@/components/ui/FilterHeader";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TextInput } from "@/components/ui/TextInput";
import { MOST_PICKED_VIBES, VIBE_OPTIONS } from "@/constants/vibes";

type VibeColor = "explorer" | "connector" | "curator" | "creator";

const COLOR_CYCLE: VibeColor[] = ["explorer", "connector", "curator", "creator"];
const FOOTER_CONTENT_PAD = 88;

const SELECTED_CLASSES: Record<VibeColor, { container: string; text: string }> = {
  explorer: { container: "bg-explorer border-explorer", text: "text-white" },
  connector: { container: "bg-connector border-connector", text: "text-white" },
  curator: { container: "bg-curator border-curator", text: "text-white" },
  creator: { container: "bg-creator border-creator", text: "text-white" },
};

const UNSELECTED_CLASSES: Record<VibeColor, { container: string; text: string }> = {
  explorer: { container: "bg-transparent border-explorer", text: "text-explorer" },
  connector: { container: "bg-transparent border-connector", text: "text-connector" },
  curator: { container: "bg-transparent border-curator", text: "text-curator" },
  creator: { container: "bg-transparent border-creator", text: "text-creator" },
};

function VibeChip({
  label,
  isSelected,
  colorIndex,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  colorIndex: number;
  onPress: () => void;
}) {
  const color = COLOR_CYCLE[colorIndex % 4];
  const styles = isSelected ? SELECTED_CLASSES[color] : UNSELECTED_CLASSES[color];

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3.5 py-1.5 cursor-pointer ${styles.container}`}
    >
      <Text className={`font-geist-medium text-sm ${styles.text}`}>{label}</Text>
    </Pressable>
  );
}

interface VibeFilterProps {
  selectedVibes: string[];
  onVibesChange: (vibes: string[]) => void;
  onClear: () => void;
  contentBottomPad?: number;
}

export function VibeFilter({
  selectedVibes,
  onVibesChange,
  onClear,
  contentBottomPad = FOOTER_CONTENT_PAD,
}: VibeFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");

  function handleToggle(vibe: string) {
    const next = selectedVibes.includes(vibe)
      ? selectedVibes.filter((v) => v !== vibe)
      : [...selectedVibes, vibe];
    onVibesChange(next);
  }

  const query = searchQuery.trim().toLowerCase();
  const filteredMostPicked = MOST_PICKED_VIBES.filter(
    (v) => !query || v.toLowerCase().includes(query),
  );
  const filteredMoreVibes = VIBE_OPTIONS.filter(
    (v) => !query || v.toLowerCase().includes(query),
  );

  return (
    <View>
      <FilterHeader
        title="Pick a"
        accentTitle="vibe."
        actionLabel="Clear"
        onAction={onClear}
      />

      <View className="relative mb-5">
        <TextInput
          placeholder="Search vibes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
          containerClassName="mb-0"
          style={{ paddingLeft: 40 }}
        />
        <View className="pointer-events-none absolute bottom-0 left-4 top-0 justify-center">
          <Search size={18} color="#9CA3AF" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: 300 }}
      >
        {filteredMostPicked.length > 0 && (
          <View className="mb-6">
            <SectionLabel label="Most Picked" className="mb-3" />
            <View className="flex-row flex-wrap gap-2">
              {filteredMostPicked.map((vibe, index) => (
                <VibeChip
                  key={vibe}
                  label={vibe}
                  isSelected={selectedVibes.includes(vibe)}
                  colorIndex={index}
                  onPress={() => handleToggle(vibe)}
                />
              ))}
            </View>
          </View>
        )}

        {filteredMoreVibes.length > 0 && (
          <View className="mb-6">
            <SectionLabel label="More Vibes" className="mb-3" />
            <View className="flex-row flex-wrap gap-2">
              {filteredMoreVibes.map((vibe, index) => (
                <VibeChip
                  key={vibe}
                  label={vibe}
                  isSelected={selectedVibes.includes(vibe)}
                  colorIndex={index}
                  onPress={() => handleToggle(vibe)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* In-flow spacer so absolute Modal footer does not cover content. */}
      <View style={{ height: contentBottomPad }} />
    </View>
  );
}

interface VibeFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedVibes: string[];
  onVibesChange: (vibes: string[]) => void;
  matchCount?: number;
}

export function VibeFilterModal({
  isVisible,
  onClose,
  selectedVibes,
  onVibesChange,
  matchCount,
}: VibeFilterModalProps) {
  const insets = useSafeAreaInsets();
  const [localVibes, setLocalVibes] = useState<string[]>(selectedVibes);

  useEffect(() => {
    if (isVisible) {
      setLocalVibes(selectedVibes);
    }
  }, [isVisible, selectedVibes]);

  function handleApply() {
    onVibesChange(localVibes);
    onClose();
  }

  function handleClear() {
    setLocalVibes([]);
  }

  return (
    <Modal
      visible={isVisible}
      onClose={onClose}
      footer={
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-geist text-sm text-ink dark:text-dk-text">
            <Text className="font-geist-bold">{localVibes.length} vibes</Text>
            {matchCount !== undefined ? (
              <Text className="text-gray-500 dark:text-dk-muted">
                {" "}
                · {matchCount} lists match
              </Text>
            ) : null}
          </Text>
          <LocalNotesButton
            label="Apply →"
            onPress={handleApply}
            variant="dark"
            size="sm"
            isWidthFull={false}
          />
        </View>
      }
    >
      <VibeFilter
        selectedVibes={localVibes}
        onVibesChange={setLocalVibes}
        onClear={handleClear}
        contentBottomPad={FOOTER_CONTENT_PAD + insets.bottom}
      />
    </Modal>
  );
}
