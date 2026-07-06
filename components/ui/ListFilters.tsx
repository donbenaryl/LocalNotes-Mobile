import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Bookmark, ChevronDown, LayoutGrid } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { DropDown } from "@/components/ui/DropDown";

interface CategoryOption {
  id: string;
  name: string;
}

interface ListFiltersProps {
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  categoryOptions: CategoryOption[];
  selectedSort: string;
  onSortChange: (value: string) => void;
  sortOptions: string[];
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: string[];
  showStatus?: boolean;
  showCategory?: boolean;
  showSort?: boolean;
  showFavorite?: boolean;
  selectedFavorite?: string;
  onFavoriteChange?: (value: string) => void;
  favoriteOptions?: string[];
}

interface FilterChipProps {
  label: string;
  value: string;
  icon?: ReactNode;
  onPress: () => void;
}

function FilterChip({ label, value, icon, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 cursor-pointer"
    >
      {icon}
      <Text className="font-geist text-xs text-gray-600 dark:text-gray-300">{label}:</Text>
      <Text className="font-geist-medium text-xs text-ink dark:text-gray-100">{value}</Text>
      <ChevronDown size={12} color="#9CA3AF" />
    </Pressable>
  );
}

export function ListFilters({
  selectedCategory,
  onCategoryChange,
  categoryOptions,
  selectedStatus,
  onStatusChange,
  statusOptions,
  showStatus = false,
  showCategory = true,
  showFavorite = false,
  selectedFavorite,
  onFavoriteChange,
  favoriteOptions,
}: ListFiltersProps) {
  const { t } = useTranslation();
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [favoritePickerOpen, setFavoritePickerOpen] = useState(false);

  const categoryLabel =
    selectedCategory === "All"
      ? t("profile.filters.all")
      : categoryOptions.find((c) => c.id === selectedCategory)?.name ?? selectedCategory;

  return (
    <View className="mb-4">
      <Text className="font-geist text-sm text-gray-600 dark:text-gray-400 mb-2">
        {t("profile.filters.filterBy")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
        <View className="flex-row gap-2">
          {showCategory && (
            <FilterChip
              label={t("profile.filters.category")}
              value={categoryLabel}
              icon={<LayoutGrid size={14} color="#9CA3AF" />}
              onPress={() => setCategoryPickerOpen(true)}
            />
          )}
          {showFavorite && onFavoriteChange && favoriteOptions && (
            <FilterChip
              label={t("profile.filters.favorites")}
              value={selectedFavorite ?? t("profile.filters.all")}
              icon={<Bookmark size={14} color="#9CA3AF" />}
              onPress={() => setFavoritePickerOpen(true)}
            />
          )}
          {showStatus && onStatusChange && statusOptions && (
            <FilterChip
              label={t("profile.filters.status")}
              value={selectedStatus ?? ""}
              onPress={() => setStatusPickerOpen(true)}
            />
          )}
        </View>
      </ScrollView>

      {showCategory && (
        <DropDown
          visible={categoryPickerOpen}
          selected={selectedCategory}
          onApply={onCategoryChange}
          onClose={() => setCategoryPickerOpen(false)}
          options={[
            { value: "All", label: t("profile.filters.all") },
            ...categoryOptions.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      )}

      {showFavorite && onFavoriteChange && favoriteOptions && (
        <DropDown
          visible={favoritePickerOpen}
          selected={selectedFavorite ?? "All"}
          onApply={onFavoriteChange}
          onClose={() => setFavoritePickerOpen(false)}
          options={favoriteOptions.map((o) => ({ value: o, label: o }))}
        />
      )}

      {showStatus && onStatusChange && statusOptions && (
        <DropDown
          visible={statusPickerOpen}
          selected={selectedStatus ?? ""}
          onApply={onStatusChange}
          onClose={() => setStatusPickerOpen(false)}
          options={statusOptions.map((o) => ({ value: o, label: o }))}
        />
      )}
    </View>
  );
}
