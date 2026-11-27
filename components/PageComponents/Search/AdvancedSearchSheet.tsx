import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal } from "@/components/ui/Modal";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { SwitchToggle, Toggle } from "@/components/ui/Toggle";
import { useCategories } from "@/hooks/useProfileList";
import {
  type SearchSort,
  useSearchStore,
} from "@/stores/useSearchStore";
import { DISTANCE_MILE_PRESETS } from "@/utils/searchAdvancedFilters";
import { FilterHeader } from "@/components/ui/FilterHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";

const SHEET_HEIGHT_RATIO = 0.85;
const FOOTER_CONTENT_PAD = 88;

interface AdvancedSearchSheetProps {
  isVisible: boolean;
  onClose: () => void;
  matchingCount?: number;
}

export function AdvancedSearchSheet({
  isVisible,
  onClose,
  matchingCount,
}: AdvancedSearchSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();

  const distanceMiles = useSearchStore((s) => s.distanceMiles);
  const selectedCategories = useSearchStore((s) => s.selectedCategories);
  const followingOnly = useSearchStore((s) => s.followingOnly);
  const sort = useSearchStore((s) => s.sort);

  const [draftDistance, setDraftDistance] = useState<number | null>(distanceMiles);
  const [draftCategories, setDraftCategories] = useState<string[]>(selectedCategories);
  const [draftFollowingOnly, setDraftFollowingOnly] = useState(followingOnly);
  const [draftSort, setDraftSort] = useState<SearchSort>(sort);

  useEffect(() => {
    if (!isVisible) return;
    setDraftDistance(distanceMiles);
    setDraftCategories(selectedCategories);
    setDraftFollowingOnly(followingOnly);
    setDraftSort(sort);
  }, [isVisible, distanceMiles, selectedCategories, followingOnly, sort]);

  const handleReset = useCallback(() => {
    setDraftDistance(null);
    setDraftCategories([]);
    setDraftFollowingOnly(false);
    setDraftSort("best");
  }, []);

  const handleApply = useCallback(() => {
    // Single store write avoids cascading header/query re-renders mid-modal dismiss.
    useSearchStore.setState({
      distanceMiles: draftDistance,
      selectedCategories: draftCategories,
      followingOnly: draftFollowingOnly,
      sort: draftSort,
    });
    onClose();
  }, [
    draftDistance,
    draftCategories,
    draftFollowingOnly,
    draftSort,
    onClose,
  ]);

  const handleToggleCategory = useCallback((categoryId: string) => {
    setDraftCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }, []);

  return (
    <Modal
      visible={isVisible}
      onClose={onClose}
      sheetHeightRatio={SHEET_HEIGHT_RATIO}
      footer={
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-sm text-ink dark:text-dk-text">
            {matchingCount !== undefined ? (
              <>
                <Text className="font-geist-bold">{matchingCount}</Text>
                {" · "}
              </>
            ) : null}
            {t("search.filters.advanced")}
          </Text>
          <View className="flex-row items-center gap-3">
            <LocalNotesButton
              label={t("search.filters.showResults")}
              onPress={handleApply}
              variant="dark"
              size="sm"
              isWidthFull={false}
            />
          </View>
        </View>
      }
    >
      <FilterHeader
        title={t("search.filters.advanced")}
        accentTitle=""
        actionLabel="Clear"
        onAction={handleReset}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <SectionLabel label={t("search.filters.distance")} className="mb-3" />
        <View className="mb-6 flex-row flex-wrap gap-2">
          {DISTANCE_MILE_PRESETS.map((miles) => {
            const label =
              miles == null
                ? t("search.filters.distanceAny")
                : t("search.filters.distanceMiles", { miles });
            return (
              <LocalNotesButton
                key={String(miles)}
                label={label}
                onPress={() => setDraftDistance(miles)}
                variant={draftDistance === miles ? "dark" : "light"}
                size="xs"
                isWidthFull={false}
              />
            );
          })}
        </View>

        <SectionLabel label={t("search.filters.categories")} className="mb-3" />
        <View className="mb-6 flex-row flex-wrap gap-2">
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              isSelected={draftCategories.includes(category.id)}
              onPress={() => handleToggleCategory(category.id)}
            />
          ))}
        </View>

        <SectionLabel label={t("search.filters.trusted")} className="mb-3" />
        <View className="mb-6 flex-row items-center justify-between gap-3 rounded-xl border border-gray-200 bg-card px-3 py-3 dark:border-dk-border dark:bg-dk-card">
          <View className="flex-1 pr-2">
            <Text className="font-geist-semibold text-sm text-ink dark:text-dk-text">
              {t("search.filters.trustedTitle")}
            </Text>
            <Text className="mt-0.5 font-geist text-xs text-gray-500 dark:text-dk-muted">
              {t("search.filters.trustedHelp")}
            </Text>
          </View>
          <SwitchToggle
            value={draftFollowingOnly}
            onChange={setDraftFollowingOnly}
          />
        </View>

        <SectionLabel label={t("search.filters.sort")} className="mb-3" />
        <Toggle
          value={draftSort}
          onChange={setDraftSort}
          fullWidth
          options={[
            { value: "best", label: t("search.filters.sortBest") },
            { value: "nearest", label: t("search.filters.sortNearest") },
            { value: "newest", label: t("search.filters.sortNewest") },
          ]}
        />
      </ScrollView>
    </Modal>
  );
}
