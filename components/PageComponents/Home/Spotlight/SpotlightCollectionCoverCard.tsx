import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { NoImage } from "@/components/ui/NoImage";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { useSpotlightImageFallback } from "@/hooks/useSpotlightImageFallback";
import { useSpotlightImpressionTracking } from "@/hooks/useSpotlightImpressionTracking";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import type {
  SpotlightCollectionEntityDAO,
  SpotlightCollectionMemberDAO,
} from "@/http/spotlight-api/type";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { SpotlightFallbackGradient } from "./SpotlightFallbackGradient";

interface SpotlightCollectionCoverCardProps {
  collection: SpotlightCollectionEntityDAO;
}

// Matches spotlight-v4's `.colcover` background exactly (#6B3A1E -> #C4622D) —
// distinct from the Hero card's own `.hero` gradient (#3D2818 -> #C4622D).
const FALLBACK_GRADIENT_COLORS = ["#6B3A1E", "#C4622D"] as const;
const GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

/** "Danae R." style short name used in the mockup metadata line. */
function formatCuratorShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? name;
  return `${parts[0]} ${parts[1][0]!.toUpperCase()}.`;
}

interface CollectionMemberRowProps {
  member: SpotlightCollectionMemberDAO;
  isLast: boolean;
}

function CollectionMemberRow({ member, isLast }: CollectionMemberRowProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const imageUrl = resolveImageUrl(member.image);
  const { showFallback, onError } = useSpotlightImageFallback(imageUrl);
  const curatorName = formatCuratorShortName(member.curator_name);

  const handleOpen = () => {
    router.push(`/lists/${member.id}` as never);
  };

  return (
    <Pressable
      onPress={handleOpen}
      accessibilityRole="button"
      accessibilityLabel={member.title}
      className={`cursor-pointer flex-row items-center gap-3 px-3.5 py-3 ${
        isLast ? "" : "border-b border-gray-100 dark:border-gray-800"
      }`}
    >
      <View className="h-11 w-11 overflow-hidden rounded-[10px]">
        {showFallback ? (
          <NoImage size="sm" appearance="flat" outerClassName="h-11 w-11 rounded-[10px]" />
        ) : (
          <Image
            source={{ uri: imageUrl! }}
            className="h-full w-full"
            resizeMode="cover"
            onError={onError}
          />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="font-geist-bold text-md capitalize text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {member.title}
        </Text>
        <Text
          className="mt-0.5 font-geist text-sm text-gray-500 dark:text-gray-400"
          numberOfLines={1}
        >
          {t("spotlight.collectionListMeta", {
            name: curatorName,
            count: member.item_count,
          })}
        </Text>
      </View>
      <ChevronRight size={16} color="#9CA3AF" />
    </Pressable>
  );
}

export function SpotlightCollectionCoverCard({ collection }: SpotlightCollectionCoverCardProps) {
  const { t } = useTranslation();
  const impressionRef = useSpotlightImpressionTracking(collection.spotlight_item_id);
  const coverUrl = resolveImageUrl(collection.cover_image);
  const { showFallback, onError } = useSpotlightImageFallback(coverUrl);
  const members = collection.lists ?? [];

  const handleExploreCta = () => {
    if (collection.spotlight_item_id) {
      void spotlightService.logCtaClickEvent(collection.spotlight_item_id);
    }
    // No collection-detail route exists yet — CTA only logs engagement.
  };

  return (
    <View ref={impressionRef}>
      <WhiteBox className="mt-2.5 overflow-hidden p-0">
        <View className="relative h-40 overflow-hidden">
          {showFallback ? (
            <SpotlightFallbackGradient colors={FALLBACK_GRADIENT_COLORS} />
          ) : (
            <Image
              source={{ uri: coverUrl! }}
              className="absolute inset-0 h-full w-full"
              resizeMode="cover"
              onError={onError}
            />
          )}
          <LinearGradient
            colors={["rgba(15,8,3,0.88)", "rgba(15,8,3,0.3)", "rgba(15,8,3,0.05)"]}
            locations={[0.15, 0.55, 1]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={GRADIENT_FILL}
          />

          <View className="absolute left-3.5 top-2.5 rounded-lg bg-brand/75 px-2.5 py-1">
            <Text className="font-geist-bold text-[9px] tracking-[1.8px] text-white/90">
              {t("spotlight.sections.collections.kicker")}
            </Text>
          </View>

          <View className="absolute bottom-3 left-3.5 right-3.5">
            <Text
              className="text-4xl italic text-white"
              numberOfLines={1}
            >
              {collection.title}
            </Text>
            {collection.description ? (
              <Text
                className="mt-0.5 font-geist text-md text-white/85"
                numberOfLines={2}
              >
                {collection.description}
              </Text>
            ) : null}
          </View>
        </View>

        {members.length > 0 ? (
          <View>
            {members.map((member, index) => (
              <CollectionMemberRow
                key={member.id}
                member={member}
                isLast={index === members.length - 1}
              />
            ))}
          </View>
        ) : null}

        {/* <Pressable
          onPress={handleExploreCta}
          accessibilityRole="button"
          accessibilityLabel={t("spotlight.collectionFooterCta")}
          className="cursor-pointer flex-row items-center justify-center gap-1.5 border-t border-gray-100 bg-gray-50 px-4 py-3.5 dark:border-gray-800 dark:bg-gray-900/60"
        >
          <Text className="font-geist-semibold text-xs text-brand">
            {t("spotlight.collectionFooterCta")}
          </Text>
          <ChevronRight size={14} color="#FF6B1A" />
        </Pressable> */}
      </WhiteBox>
    </View>
  );
}
