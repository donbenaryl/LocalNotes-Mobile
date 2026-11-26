import { Text } from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import type { Account } from "@/http/list-api/types";
import { resolveUserLabels } from "@/utils/userDisplayName";
import { resolveViewOrigin, withViewOrigin } from "@/utils/viewTracking";

interface MentionedTextProps {
  content: string;
  mentionedAccounts: Account[];
  className?: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentionTokenFor(account: Account): string {
  return resolveUserLabels(account).primary;
}

export function MentionedText({
  content,
  mentionedAccounts,
  className,
}: MentionedTextProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { origin } = useLocalSearchParams<{ origin?: string }>();

  if (mentionedAccounts.length === 0) {
    return <Text className={className}>{content}</Text>;
  }

  // Longest tokens first, so shorter usernames don't shadow longer ones.
  const tokensByLength = [...mentionedAccounts]
    .map(mentionTokenFor)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);

  if (tokensByLength.length === 0) {
    return <Text className={className}>{content}</Text>;
  }

  const pattern = new RegExp(`@(${tokensByLength.join("|")})`, "g");
  const parts = content.split(pattern);

  return (
    <Text className={className}>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return <Text key={index}>{part}</Text>;
        }
        const account = mentionedAccounts.find(
          (a) => mentionTokenFor(a) === part,
        );
        return (
          <Text
            key={index}
            onPress={
              account
                ? () =>
                    router.push(
                      withViewOrigin(
                        `/profile/${account.id}`,
                        resolveViewOrigin({ pathname, queryOrigin: origin }),
                      ) as never,
                    )
                : undefined
            }
            className="font-geist-semibold text-brand dark:text-dk-text"
          >
            @{part}
          </Text>
        );
      })}
    </Text>
  );
}
