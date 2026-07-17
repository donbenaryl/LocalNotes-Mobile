import { Text } from "react-native";
import { useRouter } from "expo-router";
import type { Account } from "@/http/list-api/types";

interface MentionedTextProps {
  content: string;
  mentionedAccounts: Account[];
  className?: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function MentionedText({
  content,
  mentionedAccounts,
  className,
}: MentionedTextProps) {
  const router = useRouter();

  if (mentionedAccounts.length === 0) {
    return <Text className={className}>{content}</Text>;
  }

  // Longest names first, so e.g. a mentioned "John" doesn't shadow a
  // separately-mentioned "John Smith" match.
  const namesByLength = [...mentionedAccounts]
    .sort((a, b) => b.name.length - a.name.length)
    .map((account) => escapeRegExp(account.name));
  const pattern = new RegExp(`@(${namesByLength.join("|")})`, "g");
  const parts = content.split(pattern);

  return (
    <Text className={className}>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return <Text key={index}>{part}</Text>;
        }
        const account = mentionedAccounts.find((a) => a.name === part);
        return (
          <Text
            key={index}
            onPress={
              account ? () => router.push(`/profile/${account.id}`) : undefined
            }
            className="font-geist-semibold text-brand"
          >
            @{part}
          </Text>
        );
      })}
    </Text>
  );
}
