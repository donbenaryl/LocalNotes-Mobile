import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { Account } from "@/http/list-api/types";
import { FollowingActivityHeader } from "./FollowingActivityHeader";

interface FollowingUnavailableCardProps {
  account: Account;
  actionText: ReactNode;
  name?: string;
  isLoading?: boolean;
  message?: string;
}

export function FollowingUnavailableCard({
  account,
  actionText,
  name,
  isLoading = false,
  message,
}: FollowingUnavailableCardProps) {
  return (
    <View className="gap-3">
      <FollowingActivityHeader account={account} actionText={actionText} />

      <View className="flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-soft p-3 dark:border-gray-700 dark:bg-gray-800/60">
        <View className="min-w-0 flex-1 gap-0.5">
          {name ? (
            <Text
              className="font-geist-semibold text-sm text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {name}
            </Text>
          ) : null}
          {!isLoading && message ? (
            <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
              {message}
            </Text>
          ) : null}
        </View>
        {isLoading ? <ActivityIndicator size="small" /> : null}
      </View>
    </View>
  );
}
