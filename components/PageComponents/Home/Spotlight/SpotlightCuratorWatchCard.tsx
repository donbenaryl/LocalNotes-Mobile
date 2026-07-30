import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/ui/FollowButton";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { useSpotlightImpressionTracking } from "@/hooks/useSpotlightImpressionTracking";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import type { SpotlightCuratorEntityDAO } from "@/http/spotlight-api/type";

interface SpotlightCuratorWatchCardProps {
  curator: SpotlightCuratorEntityDAO;
}

/** "Don Lagadan" → "Don L."; single-word names are left unchanged. */
function formatCuratorShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? name;
  return `${parts[0]} ${parts[1][0]!.toUpperCase()}.`;
}

export function SpotlightCuratorWatchCard({ curator }: SpotlightCuratorWatchCardProps) {
  const router = useRouter();
  const impressionRef = useSpotlightImpressionTracking(curator.spotlight_item_id);
  const displayName = formatCuratorShortName(curator.name);

  const handleOpen = () => {
    if (curator.spotlight_item_id) {
      void spotlightService.logOpenEvent(curator.spotlight_item_id);
    }
    router.push(`/profile/${curator.id}` as never);
  };

  return (
    <View ref={impressionRef} role="listitem" className="w-[112px]">
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        className="cursor-pointer"
      >
        <WhiteBox className="items-center gap-1.5 p-3">
          <Avatar name={curator.name} src={curator.image ?? undefined} userId={curator.id} size="md" />
          <View className="w-full items-center">
            <Text
              className="font-geist-semibold text-sm text-ink dark:text-gray-100"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {curator.personality_name ? (
              <Text
                className="mt-0.5 text-center font-geist text-[10px] text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {curator.personality_name}
              </Text>
            ) : null}
          </View>
          <View className="mt-1 w-full">
            <FollowButton
              userId={curator.id}
              initialIsFollowed={false}
              useButton
              buttonSize="xs"
            />
          </View>
        </WhiteBox>
      </Pressable>
    </View>
  );
}
