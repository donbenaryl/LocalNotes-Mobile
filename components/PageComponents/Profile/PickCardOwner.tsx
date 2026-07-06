import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { resolveImageUrl } from "@/utils/httpHelpers";
import type { Account } from "@/http/list-api/types";

interface PickCardOwnerProps {
  owner: Account;
}

export function PickCardOwner({ owner }: PickCardOwnerProps) {
  if (!owner) return null;

  return (
    <View className="flex-row items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
      <Avatar
        name={owner.name}
        src={resolveImageUrl(owner.profile_image) ?? undefined}
        size="sm"
        userId={owner.id}
      />
      <View className="min-w-0">
        <Text className="text-[10px] font-geist-medium uppercase tracking-wide text-gray-400">
          Added by
        </Text>
        <Text className="text-sm font-geist-medium text-ink dark:text-gray-100" numberOfLines={1}>
          {owner.name}
        </Text>
      </View>
    </View>
  );
}
