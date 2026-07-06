import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import type { ListItemDAO } from "@/http/list-api/types";
import { PageSectionTitle } from "@/components/ui/PageSectionTitle";

interface ForYouSectionProps {
  lists: ListItemDAO[];
  topMatchPercent?: number | null;
}

export function ForYouSection({
  lists,
  topMatchPercent,
}: ForYouSectionProps) {
  const { t } = useTranslation();

  if (lists.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="mb-2.5 flex-row items-baseline justify-between">
        <PageSectionTitle>{t("home.forYou.eyebrow")}</PageSectionTitle>
        {topMatchPercent != null ? (
          <Text className="font-geist-bold text-xs text-brand">
            {t("home.forYou.match", { percent: topMatchPercent })}
          </Text>
        ) : null}
      </View>

      <View className="gap-4">
        {lists.map((list) => (
          <ListCardDetailed
            key={list.id}
            list={list}
            variant="forYou"
          />
        ))}
      </View>
    </View>
  );
}
