import { Platform, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { FollowButton } from "@/components/ui/FollowButton";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { useSpotlightImpressionTracking } from "@/hooks/useSpotlightImpressionTracking";
import spotlightService from "@/http/spotlight-api/spotlight.service";
import type { SpotlightCuratorEntityDAO } from "@/http/spotlight-api/type";

interface SpotlightCuratorOfWeekCardProps {
  curator: SpotlightCuratorEntityDAO;
}

/** Spotlight card corner glow — larger than v4's 120px for a stronger wash. */
const GLOW_SIZE = 200;

/** Matches `.curator .badge` → `box-shadow: 0 0 14px rgba(232,89,12,0.45)`. */
const badgeGlowShadow = Platform.select({
  ios: {
    shadowColor: "#E8590C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  android: {
    elevation: 0,
  },
  default: {},
});

export function SpotlightCuratorOfWeekCard({ curator }: SpotlightCuratorOfWeekCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const impressionRef = useSpotlightImpressionTracking(curator.spotlight_item_id);

  const goToProfile = () => router.push(`/profile/${curator.id}` as never);

  const handleOpen = () => {
    if (curator.spotlight_item_id) {
      void spotlightService.logOpenEvent(curator.spotlight_item_id);
    }
    goToProfile();
  };

  const handleViewLists = () => {
    if (curator.spotlight_item_id) {
      void spotlightService.logCtaClickEvent(curator.spotlight_item_id);
    }
    goToProfile();
  };

  return (
    <Pressable ref={impressionRef} onPress={handleOpen} className="mt-2.5">
      <WhiteBox className="relative overflow-hidden border-ink bg-ink p-4 dark:border-ink dark:bg-ink">
        <View pointerEvents="none" className="absolute -right-[80px] -top-[80px] h-[200px] w-[200px]">
          <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
            <Defs>
              <RadialGradient id="cotwGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="rgb(232,89,12)" stopOpacity={0.38} />
                <Stop offset="70%" stopColor="rgb(232,89,12)" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill="url(#cotwGlow)" />
          </Svg>
        </View>

        {Platform.OS === "android" ? (
          <View pointerEvents="none" className="absolute right-0 top-0 h-[72px] w-[130px]">
            <Svg width={130} height={72}>
              <Defs>
                <RadialGradient id="cotwBadgeGlow" cx="72%" cy="40%" r="45%">
                  <Stop offset="0%" stopColor="rgb(232,89,12)" stopOpacity={0.45} />
                  <Stop offset="100%" stopColor="rgb(232,89,12)" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={94} cy={28} r={40} fill="url(#cotwBadgeGlow)" />
            </Svg>
          </View>
        ) : null}

        <View
          className="absolute right-3 top-3 rounded-[9px] bg-[rgba(232,89,12,0.3)]"
          style={badgeGlowShadow}
        >
          <Badge
            label={t("spotlight.curatorOfWeek.badge")}
            variant="secondary"
            leftIcon={<Sparkles size={9} color="#F7C59F" strokeWidth={2} />}
            className="!rounded-[9px] !bg-transparent px-[9px] py-1"
            textClassname="!text-[9px] !text-[#F7C59F] font-geist-semibold tracking-[0.5px]"
          />
        </View>

        <View className="mt-3.5 flex-row items-center gap-2.5">
          <Avatar name={curator.name} src={curator.image ?? undefined} userId={curator.id} size="md2" />
          <View className="min-w-0 flex-1">
            <Text className="font-geist-bold text-xl text-white" numberOfLines={1}>
              {curator.name}
            </Text>
            {/* No curator "role"/persona field is exposed on SpotlightCuratorEntityDAO
                (that data lives on accounts.PersonalityProfile, not wired into
                spotlight/public.py::serialize_entity) — list count stands in for it. */}
            <Text className="mt-0.5 text-md text-[#5DCAA5]" numberOfLines={1}>
              {t("spotlight.sections.curators.listsCount", { count: curator.list_count })}
            </Text>
          </View>
        </View>

        {curator.quote ? (
          <Text className="mt-2.5 font-fraunces text-md italic leading-[18px] text-[#C9C7BC]">
            &ldquo;{curator.quote}&rdquo;
          </Text>
        ) : null}

        <View className="mt-3 flex-row gap-2">
          <View className="flex-1">
            <LocalNotesButton
              label={t("spotlight.curatorOfWeek.viewLists")}
              onPress={handleViewLists}
              variant="light"
              size="sm"
              isRounded
            />
          </View>
          <View className="flex-1">
            {/* No is_followed field on SpotlightCuratorEntityDAO either, same gap as
                §3.5/§3.6's local isSaved defaults — starts unfollowed, self-corrects
                on next fetch if wrong. */}
            <FollowButton
              userId={curator.id}
              initialIsFollowed={false}
              useButton
              buttonSize="sm"
            />
          </View>
        </View>
      </WhiteBox>
    </Pressable>
  );
}
