import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronUp, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { CardHero } from "@/components/ui/CardHero";
import { FollowButton } from "@/components/ui/FollowButton";
import { ListAuthorRow } from "@/components/ui/ListAuthorRow";
import { ScrollableContainer } from "@/components/ui/ScrollableContainer";
import { useBusinessFollow } from "@/hooks/useBusinessFollow";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import type {
  BusinessBranchDAO,
  BusinessItemDAO,
  BusinessLocation,
} from "@/http/business-api/types";
import type { ViewOrigin } from "@/http/types";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { withViewOrigin } from "@/utils/viewTracking";
import { WhiteBox } from "./WhiteBox";

interface BusinessCardDetailedProps {
  business: BusinessItemDAO;
  viewOrigin?: ViewOrigin;
  onFollowChange?: (id: string, isFollowed: boolean) => void;
}

function getPrimaryLocation(business: BusinessItemDAO): BusinessLocation | null {
  return business.branches?.[0]?.location ?? business.location ?? null;
}

function formatCity(location: BusinessLocation | null): string | null {
  if (!location?.city) return null;
  return location.region ? `${location.city}, ${location.region}` : location.city;
}

export function getBusinessLogoUrl(business: BusinessItemDAO): string | null {
  return resolveImageUrl(business.logo) ?? null;
}

interface BranchRowContentProps {
  name?: string | null;
  location: BusinessLocation | null;
  iconColor: string;
}

function BranchRowContent({ name, location, iconColor }: BranchRowContentProps) {
  const cityLabel = formatCity(location);
  const streetAddress = location?.street_address?.trim() || null;

  return (
    <>
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-gray-900">
        <MapPin size={16} color={iconColor} />
      </View>

      <View className="min-w-0 flex-1 justify-center">
        <Text
          className="font-geist-semibold text-md text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {name || streetAddress || cityLabel}
        </Text>
        {cityLabel ? (
          <Text
            className="font-geist text-xs text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {streetAddress && name ? `${streetAddress} · ${cityLabel}` : cityLabel}
          </Text>
        ) : null}
      </View>
    </>
  );
}

export function BusinessCardDetailed({
  business,
  viewOrigin = "discovery",
  onFollowChange,
}: BusinessCardDetailedProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { isFollowed, isToggling, toggle } = useBusinessFollow(
    business.id,
    business.is_followed ?? false,
    onFollowChange,
  );
  const [branchesExpanded, setBranchesExpanded] = useState(false);

  useEffect(() => {
    setBranchesExpanded(false);
  }, [business.id]);

  const logoUrl = getBusinessLogoUrl(business);
  const location = getPrimaryLocation(business);
  const cityLabel = formatCity(location);
  const streetAddress = location?.street_address?.trim() || null;
  const branches: BusinessBranchDAO[] = business.branches ?? [];
  const primaryBranch = branches[0] ?? null;
  const extraBranches = Math.max(0, branches.length - 1);
  const heroSubtitle =
    [business.business_type, cityLabel].filter(Boolean).join(" · ") || undefined;
  const isOwnBusiness =
    Boolean(currentUserId) && business.owner_account_id === currentUserId;
  const listCount = business.list_count ?? 0;
  const followerCount = business.follower_count ?? 0;
  const isDark = theme === "dark";
  const iconColor = isDark ? "#9CA3AF" : "#6B7280";
  const showHeroFollow = Boolean(logoUrl) && !isOwnBusiness;
  const showIdentityBlock =
    !logoUrl || Boolean(business.bio) || showHeroFollow;
  const hasLocation = Boolean(cityLabel || streetAddress);
  const isShowingAllBranches = branchesExpanded && extraBranches > 0;

  const handleOpen = () => {
    router.push(withViewOrigin(`/business/${business.id}`, viewOrigin) as never);
  };

  return (
    <WhiteBox className="overflow-hidden p-0">
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={business.name}
      >
        {logoUrl ? (
          <CardHero
            imageUrl={logoUrl}
            title={business.name}
            subtitle={heroSubtitle}
            aspectClassName="aspect-[16/10.5]"
          />
        ) : null}

        {showIdentityBlock ? (
          <View className={logoUrl ? "px-4 pt-2.5" : "px-4 pt-4"}>
            {!logoUrl ? (
              <>
                <ListAuthorRow
                  account={{
                    id: business.id,
                    name: business.name,
                    profile_image: business.logo,
                  }}
                  subtitle={business.business_type || cityLabel}
                  isOwnList={isOwnBusiness}
                  initialIsFollowed={business.is_followed ?? false}
                  isFollowed={isFollowed}
                  onFollowToggle={toggle}
                  followLoading={isToggling}
                  disableAvatarNavigation
                />
                <Text
                  className="mb-1 font-geist-extrabold text-[22px] leading-7 text-ink dark:text-gray-100"
                  numberOfLines={2}
                >
                  {business.name}
                </Text>
              </>
            ) : null}

            {showHeroFollow ? (
              <View className="mb-2 flex-row justify-end">
                <FollowButton
                  userId={business.id}
                  initialIsFollowed={business.is_followed ?? false}
                  isFollowed={isFollowed}
                  onToggle={toggle}
                  loading={isToggling}
                  variant="outline"
                />
              </View>
            ) : null}

            {business.bio ? (
              <Text
                className="mb-3 font-geist text-[14.5px] leading-5 text-gray-500 dark:text-gray-400"
                numberOfLines={3}
              >
                {business.bio}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {hasLocation ? (
        <View
          className={`mx-4 mb-3 rounded-2xl bg-soft px-3 pt-3 dark:bg-gray-800 ${
            showIdentityBlock ? "" : "mt-3"
          } ${isShowingAllBranches ? "pb-1" : "pb-3"}`}
        >
          {isShowingAllBranches ? (
            <>
              <ScrollableContainer className="max-h-44">
                {branches.map((branch, index) => (
                  <Pressable
                    key={branch.id}
                    onPress={handleOpen}
                    accessibilityRole="button"
                    accessibilityLabel={branch.name || business.name}
                    className={`cursor-pointer flex-row items-center gap-3 py-1 ${
                      index > 0
                        ? "border-t border-gray-200/60 dark:border-gray-700/60"
                        : ""
                    }`}
                  >
                    <BranchRowContent
                      name={branch.name}
                      location={branch.location}
                      iconColor={iconColor}
                    />
                  </Pressable>
                ))}
              </ScrollableContainer>

              <Pressable
                onPress={() => setBranchesExpanded(false)}
                accessibilityRole="button"
                accessibilityLabel={t("home.business.showLessBranches")}
                accessibilityState={{ expanded: true }}
                className="mt-1 cursor-pointer flex-row items-center justify-center gap-1.5 border-t border-gray-200/80 pt-2.5 pb-1.5 dark:border-gray-700"
                hitSlop={4}
              >
                <ChevronUp size={15} color={iconColor} />
                <Text className="font-geist-semibold text-[13px] text-gray-600 dark:text-gray-300">
                  {t("home.business.showLessBranches")}
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={handleOpen}
                accessibilityRole="button"
                accessibilityLabel={
                  primaryBranch?.name || streetAddress || cityLabel || business.name
                }
                className="min-w-0 flex-1 cursor-pointer flex-row items-center gap-3"
              >
                <BranchRowContent
                  name={primaryBranch?.name}
                  location={location}
                  iconColor={iconColor}
                />
              </Pressable>

              {extraBranches > 0 ? (
                <Pressable
                  onPress={() => setBranchesExpanded(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t("home.business.seeMoreBranches", {
                    count: extraBranches,
                  })}
                  accessibilityState={{ expanded: false }}
                  className="h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-white dark:bg-gray-900"
                >
                  <Text className="text-md text-ink dark:text-gray-100">
                    {t("home.business.moreBranches", { count: extraBranches })}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={business.name}
        className={`flex-row items-center gap-3 px-4 pb-3 ${
          showIdentityBlock || hasLocation ? "pt-1" : "pt-3"
        }`}
      >
        <Text className="font-geist-medium text-xs text-gray-500 dark:text-gray-400">
          {t("home.business.listsCount", { count: listCount })}
        </Text>
        <Text className="text-xs text-gray-300 dark:text-gray-600">·</Text>
        <Text className="font-geist-medium text-xs text-gray-500 dark:text-gray-400">
          {t("home.business.followersCount", { count: followerCount })}
        </Text>
      </Pressable>
    </WhiteBox>
  );
}
