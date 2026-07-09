import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { Bookmark } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { toast } from "@/components/ui/Toast";
import businessService from "@/http/business-api/business.service";
import type { BusinessItemDAO } from "@/http/business-api/types";
import { resolveImageUrl } from "@/utils/httpHelpers";

interface BusinessCardProps {
  data: BusinessItemDAO;
  onPress?: () => void;
  onFollowChange?: (id: string, isFollowed: boolean) => void;
}

function formatBranchCity(data: BusinessItemDAO): string | null {
  const branch = data.branches?.[0];
  const location = branch?.location ?? data.location;
  if (!location?.city) return null;
  return location.region
    ? `${location.city}, ${location.region}`
    : location.city;
}

export function BusinessCard({
  data,
  onPress,
  onFollowChange,
}: BusinessCardProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#D1D5DB" : "#6B7280";
  const [isFollowed, setIsFollowed] = useState(data.is_followed ?? false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsFollowed(data.is_followed ?? false);
  }, [data.is_followed]);

  const logoUri = data.logo ? resolveImageUrl(data.logo) ?? data.logo : null;
  const cityLabel = formatBranchCity(data);
  const extraBranches =
    (data.branches?.length ?? 0) > 1 ? data.branches!.length - 1 : 0;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    toast.info(t("alerts.comingSoonMessage"), {
      title: t("alerts.comingSoon"),
    });
  };

  const handleFollowToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (isFollowed) {
        await businessService.unfollowBusiness(data.id);
      } else {
        await businessService.followBusiness(data.id);
      }
      const next = !isFollowed;
      setIsFollowed(next);
      onFollowChange?.(data.id, next);
    } catch (error) {
      console.error(`Failed to toggle follow for business ${data.id}:`, error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      className="cursor-pointer"
    >
      <WhiteBox className="flex-row items-center gap-3 p-3">
        <View className="h-12 w-12 overflow-hidden rounded-[10px] bg-soft dark:bg-gray-800">
          {logoUri ? (
            <Image
              source={{ uri: logoUri }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="font-geist-bold text-base text-gray-400">
                {data.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View className="min-w-0 flex-1">
          {data.business_type ? (
            <Text
              className="font-geist-semibold text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500"
              numberOfLines={1}
            >
              {data.business_type}
            </Text>
          ) : null}

          <Text
            className="mt-0.5 font-geist-bold text-[13.5px] text-ink dark:text-gray-100"
            numberOfLines={1}
          >
            {data.name}
          </Text>

          {data.bio ? (
            <Text
              className="mt-0.5 font-geist text-[11.5px] text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {data.bio}
            </Text>
          ) : cityLabel ? (
            <Text
              className="mt-0.5 font-geist text-[11.5px] text-gray-500 dark:text-gray-400"
              numberOfLines={1}
            >
              {cityLabel}
              {extraBranches > 0
                ? ` · ${t("search.business.moreBranches", { count: extraBranches })}`
                : ""}
            </Text>
          ) : null}

          {typeof data.list_count === "number" && data.list_count > 0 ? (
            <Text className="mt-1 font-geist-medium text-[11px] text-emerald-600 dark:text-emerald-400">
              ↑ {t("search.business.listsCount", { count: data.list_count })}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => {
            void handleFollowToggle();
          }}
          disabled={isToggling}
          accessibilityRole="button"
          accessibilityLabel={
            isFollowed
              ? t("search.business.following")
              : t("search.business.follow")
          }
          className={`h-[30px] w-[30px] items-center justify-center rounded-lg cursor-pointer ${
            isFollowed
              ? "bg-brand-tint dark:bg-brand/20"
              : "bg-soft dark:bg-gray-800"
          }`}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color="#FF6B1A" />
          ) : (
            <Bookmark
              size={13}
              color={isFollowed ? "#FF6B1A" : iconColor}
              fill={isFollowed ? "#FF6B1A" : "transparent"}
            />
          )}
        </Pressable>
      </WhiteBox>
    </Pressable>
  );
}
