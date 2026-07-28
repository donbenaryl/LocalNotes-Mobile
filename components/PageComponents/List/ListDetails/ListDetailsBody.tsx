import { useMemo } from "react";
import { Text, View } from "react-native";
import { Building2, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatListLocation } from "@/utils/listUi";
import {
  mapSearchItemToListItemPublic,
  sortPicksWithImagesFirst,
} from "@/utils/homePicks";
import type { ListItemDAO, ListItemPublic } from "@/http/list-api/types";
import { Badge } from "@/components/ui/Badge";
import { PageSectionTitle } from "@/components/ui/PageSectionTitle";
import { PickCard } from "@/components/PageComponents/Profile/PickCard";

interface ListDetailsBodyProps {
  list: ListItemDAO;
  onRefresh?: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function mapListItemsToPicks(list: ListItemDAO): ListItemPublic[] {
  const picks = (list.items ?? [])
    .map((item) => {
      const pick = mapSearchItemToListItemPublic(item);
      return {
        ...pick,
        owner: item.owner ?? list.account,
        location: pick.location ?? list.location ?? null,
      };
    })
    .filter((pick) => Boolean(pick.business_name));

  return sortPicksWithImagesFirst(picks);
}

function ListDetailsPicksGrid({
  picks,
  onRefresh,
}: {
  picks: ListItemPublic[];
  onRefresh?: () => void;
}) {
  const { leftColumn, rightColumn } = useMemo(() => {
    const left = picks.filter((_, index) => index % 2 === 0);
    const right = picks.filter((_, index) => index % 2 === 1);

    return { leftColumn: left, rightColumn: right };
  }, [picks]);

  return (
    <View className="flex-row gap-3 px-[18px]">
      <View className="flex-1 gap-3">
        {leftColumn.map((pick) => (
          <PickCard
            key={pick.id}
            data={pick}
            readOnly
            onRefresh={onRefresh}
          />
        ))}
      </View>
      <View className="flex-1 gap-3">
        {rightColumn.map((pick) => (
          <PickCard
            key={pick.id}
            data={pick}
            readOnly
            onRefresh={onRefresh}
          />
        ))}
      </View>
    </View>
  );
}

export function ListDetailsBody({ list, onRefresh }: ListDetailsBodyProps) {
  const { t } = useTranslation();
  const locationLabel = formatListLocation(list.location);
  const picksCount = list.items?.length ?? 0;
  const picks = useMemo(() => mapListItemsToPicks(list), [list]);

  return (
    <View>
      <View className="px-[18px] pt-1">
        <View className="flex-col items-center gap-2 text-center">
          <Text className="font-geist-bold text-2xl leading-7 text-ink dark:text-gray-100 mb-2">
            {list.name}
          </Text>

          <View className="flex-row items-center gap-2">
            {list.categories.length > 0
              ? list.categories.map((category) => (
                  <Badge
                    key={category}
                    label={category}
                    variant="primary"
                    className="mb-4"
                  />
                ))
              : null}
          </View>
        </View>

        {list.notes ? (
          <Text className="mt-2 font-fraunces text-sm italic leading-5 text-gray-600 dark:text-gray-400">
            {stripHtml(list.notes)}
          </Text>
        ) : null}
      </View>

      <View className="mt-2.5 flex-row flex-wrap items-center gap-3.5 border-b border-gray-200 px-[18px] py-2.5 dark:border-gray-800">
        {locationLabel ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color="#737373" />
            <Text className="font-geist-medium text-[11.5px] text-gray-500 dark:text-gray-400">
              {locationLabel}
            </Text>
          </View>
        ) : null}
        {locationLabel ? (
          <Text className="font-geist-medium text-[11.5px] text-gray-400">
            ·
          </Text>
        ) : null}
        <Text className="font-geist-medium text-[11.5px] text-gray-500 dark:text-gray-400">
          {t("home.picksCount", { count: picksCount })}
        </Text>
        <Text className="ml-auto font-geist-semibold text-[11.5px] text-gray-600 dark:text-gray-300">
          {t("home.savesCount", { count: list.saves ?? 0 })}
        </Text>
      </View>

      <View className="mt-1 border-t border-gray-200 bg-soft/70 pb-4 pt-5 dark:border-gray-800 dark:bg-gray-900/40">
        <View className="mb-4 px-[18px]">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1 flex-row items-start gap-2.5">
              <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-brand-tint dark:bg-brand/20">
                <Building2 size={16} color="#FF6B1A" />
              </View>
              <View className="min-w-0 flex-1">
                <PageSectionTitle className="text-brand dark:text-brand">
                  {t("listDetail.picksSection")}
                </PageSectionTitle>
                <Text className="mt-1 font-geist text-xs leading-4 text-gray-500 dark:text-gray-400">
                  {t("listDetail.picksSectionSubtitle")}
                </Text>
              </View>
            </View>
            <Badge label={t("home.picksCount", { count: picksCount })} variant="primary" size="md" />
          </View>
        </View>

        {picks.length === 0 ? (
          <Text className="px-[18px] font-geist text-sm text-gray-500 dark:text-gray-400">
            {t("listDetail.noPicks")}
          </Text>
        ) : (
          <ListDetailsPicksGrid picks={picks} onRefresh={onRefresh} />
        )}
      </View>
    </View>
  );
}
