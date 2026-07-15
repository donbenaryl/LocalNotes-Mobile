import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { Toggle } from "@/components/ui/Toggle";

interface CategoryOption {
  id: string;
  name: string;
}

type FavoriteFilterValue = "All" | "Favorites only";

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
}: ListFiltersProps) {
  const { t } = useTranslation();

  const favoriteValue: FavoriteFilterValue =
    selectedFavorite === "Favorites only" ? "Favorites only" : "All";

  return (
    <View className="mb-4 gap-3">
      {showCategory && (
        <View>
          <Text className="mb-2 font-geist text-sm text-gray-600 dark:text-gray-400">
            {t("profile.filters.category")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <CategoryChip
              label={t("profile.filters.all")}
              isSelected={selectedCategory === "All"}
              onPress={() => onCategoryChange("All")}
            />
            {categoryOptions.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                isSelected={selectedCategory === category.id}
                onPress={() => onCategoryChange(category.id)}
              />
            ))}
          </View>
        </View>
      )}

      {showFavorite && onFavoriteChange && (
        <View>
          <Text className="mb-2 font-geist text-sm text-gray-600 dark:text-gray-400">
            {t("profile.filters.favorites")}
          </Text>
          <Toggle<FavoriteFilterValue>
            value={favoriteValue}
            onChange={onFavoriteChange}
            options={[
              { value: "All", label: t("profile.filters.all") },
              { value: "Favorites only", label: t("profile.filters.favorites") },
            ]}
            className="self-start"
          />
        </View>
      )}

      {showStatus && onStatusChange && statusOptions && statusOptions.length > 0 && (
        <View>
          <Text className="mb-2 font-geist text-sm text-gray-600 dark:text-gray-400">
            {t("profile.filters.status")}
          </Text>
          <Toggle
            value={selectedStatus ?? statusOptions[0]}
            onChange={onStatusChange}
            options={statusOptions.map((option) => ({
              value: option,
              label: option,
            }))}
            className="self-start"
          />
        </View>
      )}
    </View>
  );
}
