import type { ReactNode } from "react";
import { Text } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import type { ActivityItemDAO } from "@/http/home-api/type";
import { resolveViewOrigin, withViewOrigin } from "@/utils/viewTracking";
import { FollowingActivityHeader } from "./FollowingActivityHeader";

interface FollowingActivityRowProps {
  item: ActivityItemDAO;
}

/** Header-only card for follows and for list/pick rows whose target was deleted. */
export function FollowingActivityRow({ item }: FollowingActivityRowProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { origin } = useLocalSearchParams<{ origin?: string }>();
  const targetName = item.data.name;

  let actionText: ReactNode;
  if (item.entity === "user" && item.action === "follow") {
    const targetId = item.data.id;
    const openProfile = () =>
      router.push(
        withViewOrigin(
          `/profile/${targetId}`,
          resolveViewOrigin({ pathname, queryOrigin: origin }),
        ) as never,
      );
    actionText = (
      <Trans
        i18nKey="home.following.activity.follow"
        values={{ name: targetName }}
        parent={Text}
        components={{
          name: targetId ? (
            <Text
              onPress={openProfile}
              accessibilityRole="link"
              className="font-geist-semibold underline decoration-dashed capitalize"
         
            />
          ) : (
            <Text />
          ),
        }}
      />
    );
  } else {
    const kind = item.entity === "list_item" ? "pick" : "list";
    const verb = t(`home.following.activity.${kind}.${item.action}`, {
      defaultValue: t("home.following.activity.fallback"),
    });
    actionText = targetName ? `${verb} · ${targetName}` : verb;
  }

  return (
    <FollowingActivityHeader account={item.account} actionText={actionText} />
  );
}
