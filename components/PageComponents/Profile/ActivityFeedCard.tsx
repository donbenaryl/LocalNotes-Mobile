import { Text, View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Pencil,
  PlusCircle,
  Share2,
  UserPlus,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { ActivityItemDAO } from "@/http/home-api/type";
import { formatRelativeTime } from "@/utils/time";

interface ActivityFeedCardProps {
  item: ActivityItemDAO;
}

const ACTION_CONFIG: Record<
  ActivityItemDAO["action"],
  { label: string; icon: LucideIcon; color: string }
> = {
  create: { label: "created a list", icon: PlusCircle, color: "#22C55E" },
  update: { label: "updated a list", icon: Pencil, color: "#60A5FA" },
  like: { label: "liked", icon: Heart, color: "#EF4444" },
  save: { label: "saved", icon: Bookmark, color: "#EAB308" },
  share: { label: "shared", icon: Share2, color: "#A855F7" },
  comment: { label: "commented on", icon: MessageCircle, color: "#3B82F6" },
  follow: { label: "followed", icon: UserPlus, color: "#FF6B1A" },
};

export function ActivityFeedCard({ item }: ActivityFeedCardProps) {
  const config = ACTION_CONFIG[item.action];
  const Icon = config.icon;

  return (
    <View className="flex-row items-start gap-3 p-3 rounded-xl">
      <Avatar
        name={item.account.name}
        src={item.account.profile_image ?? undefined}
        size="sm"
        userId={item.account.id}
      />

      <View className="flex-1 min-w-0">
        <Text className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
          <Text className="font-geist-semibold">{item.account.name}</Text>
          {" "}
          <Text className="text-gray-600 dark:text-gray-400">{config.label}</Text>
          {item.data.name ? (
            <>
              {" "}
              <Text className="font-geist-medium text-ink dark:text-gray-100">
                {item.data.name}
              </Text>
            </>
          ) : null}
        </Text>
        <View className="flex-row items-center gap-1 mt-1">
          <Icon size={14} color={config.color} />
          <Text className="text-xs text-gray-400">{formatRelativeTime(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}
