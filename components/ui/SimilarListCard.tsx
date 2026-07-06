import { Pressable, Text, View } from "react-native";
import { FolderOpen } from "lucide-react-native";
import type { Category } from "@/http/list-api/types";
import { WhiteBox } from "./WhiteBox";

interface SimilarListCardProps extends Category {
  onPress?: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SimilarListCard({
  name,
  metadata,
  onPress,
}: SimilarListCardProps) {
  return (
    <Pressable onPress={onPress}>
      <WhiteBox>
        <View className="flex-row items-start gap-3 mb-3">
          <View className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 items-center justify-center">
            <FolderOpen size={28} color="#2563EB" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-lg font-geist-bold text-ink dark:text-gray-100">
              {name} List
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Updated {formatDate(metadata.updated_at)}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {metadata.pin_text}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {metadata.list_count} list{metadata.list_count !== 1 ? "s" : ""}
        </Text>
      </WhiteBox>
    </Pressable>
  );
}
