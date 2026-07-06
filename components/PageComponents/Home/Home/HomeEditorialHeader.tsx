import { useMemo } from "react";
import { Text, View } from "react-native";
import { ChevronDown, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getEditorialTimePhrase,
  getTimeOfDayLabel,
  type TimeOfDayPeriod,
} from "@/utils/time";

interface HomeEditorialHeaderProps {
  cityLabel: string;
  isAllLocations?: boolean;
  isCityLoading?: boolean;
}

export function HomeEditorialHeader({
  cityLabel,
  isAllLocations = false,
  isCityLoading = false,
}: HomeEditorialHeaderProps) {
  const { t, i18n } = useTranslation();

  const timeLabel = useMemo(
    () =>
      getTimeOfDayLabel(
        (period: TimeOfDayPeriod) => t(`home.timeOfDay.${period}`),
        new Date(),
        i18n.language,
      ),
    [t, i18n.language],
  );

  const editorialTimePhrase = useMemo(
    () =>
      getEditorialTimePhrase(
        (period: TimeOfDayPeriod) => t(`home.editorial.timePhrase.${period}`),
      ),
    [t],
  );

  const displayCity = cityLabel || t("home.unknownLocation");

  return (
    <View className="mb-4">
      {isCityLoading ? (
        <View className="gap-2">
          <Skeleton className="h-7 w-4/5 rounded-lg" />
          <Skeleton className="h-6 w-2/5 rounded-lg" />
        </View>
      ) : (
        <View>
          <Text className="font-geist-extrabold text-3xl leading-tight tracking-tight text-ink dark:text-gray-100">
            {isAllLocations
              ? t("home.editorial.titleAll", { timePhrase: editorialTimePhrase })
              : t("home.editorial.title", {
                  timePhrase: editorialTimePhrase,
                  city: displayCity,
                })}
          </Text>
          <Text className="italic text-3xl leading-tight text-brand">
            {t("home.editorial.subtitle")}
          </Text>
        </View>
      )}
    </View>
  );
}
