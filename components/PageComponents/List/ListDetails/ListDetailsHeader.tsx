import { useMemo } from "react";
import { Text, View } from "react-native";
import { Ban, Flag } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { MatchBadge } from "@/components/ui/MatchBadge";
import { PersonalityName } from "@/components/ui/PersonalityName";
import { CardOptionsMenu } from "@/components/ui/CardOptionsMenu";
import { toast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { formatRelativeTime } from "@/utils/time";
import type { ListItemDAO } from "@/http/list-api/types";

interface ListDetailsHeaderProps {
  list: ListItemDAO;
}

export function ListDetailsHeader({ list }: ListDetailsHeaderProps) {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnList = currentUserId === list.account.id;
  const gradientColors = getPersonalityGradientColors(
    list.account.personality_color,
  );
  const personalityName =
    list.personality_name ?? list.account.personality_name ?? null;
  const lastUpdated = list.updated_at ?? list.created_at;

  const menuItems = useMemo(
    () => [
      {
        kind: "action" as const,
        key: "report",
        label: t("listDetail.report"),
        icon: Flag,
        onPress: () => {
          toast.info(t("alerts.comingSoonMessage"), {
            title: t("alerts.comingSoon"),
          });
        },
      },
      {
        kind: "action" as const,
        key: "block",
        label: t("listDetail.block"),
        icon: Ban,
        onPress: () => {
          toast.info(t("alerts.comingSoonMessage"), {
            title: t("alerts.comingSoon"),
          });
        },
      },
    ],
    [t],
  );

  return (
    <View className="pb-2 border-b border-gray-200 dark:border-gray-700 mb-4">
      <PageHeader borderless rightChild={<CardOptionsMenu items={menuItems} />} />

      <View className="gap-3 px-6 pb-2">
        <View className="flex-row items-center gap-2.5">
          <Avatar
            name={list.account.name}
            src={resolveImageUrl(list.account.profile_image) ?? undefined}
            userId={list.account.id}
            size="md"
            gradientColors={gradientColors}
          />

          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-1">
              <Text
                className="font-geist-bold text-sm text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {list.account.name}
              </Text>
              {personalityName ? (
                <PersonalityName
                  name={personalityName}
                  personalityColor={list.account.personality_color}
                  variant="text"
                />
              ) : null}
            </View>
            <Text className="mt-0.5 font-geist text-[11.5px] text-gray-500 dark:text-gray-400">
              {t("listDetail.lastPickAdded", {
                time: formatRelativeTime(lastUpdated),
              })}
            </Text>
          </View>

          <MatchBadge
            userId={list.account.id}
            personalityColor={list.account.personality_color}
            enabled={!isOwnList}
          />

          {!isOwnList ? (
            <FollowButton
              userId={list.account.id}
              initialIsFollowed={list.account_is_followed}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
