import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { FilterHeader } from "@/components/ui/FilterHeader";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { Modal } from "@/components/ui/Modal";
import { useCategories } from "@/hooks/useProfileList";

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onApply: () => void;
  onClear: () => void;
  matchCount?: number;
}

export function CategoryFilter({
  selectedCategories,
  onCategoriesChange,
  onApply,
  onClear,
  matchCount,
}: CategoryFilterProps) {
  const { categories } = useCategories();

  function handleToggle(categoryId: string) {
    const next = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoriesChange(next);
  }

  return (
    <View>
      <FilterHeader
        title="Pick a"
        accentTitle="category."
        actionLabel="Clear"
        onAction={onClear}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 300 }}
      >
        <View className="flex-row flex-wrap gap-2 mb-2">
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              isSelected={selectedCategories.includes(category.id)}
              onPress={() => handleToggle(category.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <Text className="font-geist text-sm text-ink dark:text-gray-100">
          <Text className="font-geist-bold">
            {selectedCategories.length} categories
          </Text>
          {matchCount !== undefined ? (
            <Text className="text-gray-500 dark:text-gray-400"> · {matchCount} lists match</Text>
          ) : null}
        </Text>
        <LocalNotesButton
          label="Apply →"
          onPress={onApply}
          variant="dark"
          isRounded={true}
          size="sm"
          isWidthFull={false}
        />
      </View>
    </View>
  );
}

interface CategoryFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  matchCount?: number;
}

export function CategoryFilterModal({
  isVisible,
  onClose,
  selectedCategories,
  onCategoriesChange,
  matchCount,
}: CategoryFilterModalProps) {
  const [localCategories, setLocalCategories] = useState<string[]>(selectedCategories);

  useEffect(() => {
    if (isVisible) {
      setLocalCategories(selectedCategories);
    }
  }, [isVisible, selectedCategories]);

  function handleApply() {
    onCategoriesChange(localCategories);
    onClose();
  }

  function handleClear() {
    setLocalCategories([]);
  }

  return (
    <Modal visible={isVisible} onClose={onClose}>
      <CategoryFilter
        selectedCategories={localCategories}
        onCategoriesChange={setLocalCategories}
        onApply={handleApply}
        onClear={handleClear}
        matchCount={matchCount}
      />
    </Modal>
  );
}
