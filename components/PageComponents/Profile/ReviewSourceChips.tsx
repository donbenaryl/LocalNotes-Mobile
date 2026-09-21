import { Pressable, ScrollView, Text, View } from "react-native";
import { Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import type { ReviewProviderId } from "@/http/reviews-api/types";

export type ReviewSourceFilter = "all" | ReviewProviderId;

interface ProviderChipMeta {
  id: ReviewSourceFilter;
  label: string;
  letter?: string;
  badgeClass?: string;
  letterClass?: string;
}

const PROVIDERS: ProviderChipMeta[] = [
  { id: "all", label: "All" },
  {
    id: "google",
    label: "Google",
    letter: "G",
    badgeClass: "bg-[#4285F4]",
    letterClass: "text-white",
  },
  {
    id: "yelp",
    label: "Yelp",
    letter: "y",
    badgeClass: "bg-[#D32323]",
    letterClass: "text-white",
  },
  {
    id: "tripadvisor",
    label: "TripAdvisor",
    letter: "T",
    badgeClass: "bg-[#34E0A1]",
    letterClass: "text-black",
  },
  {
    id: "amazon",
    label: "Amazon",
    letter: "a",
    badgeClass: "bg-[#FF9900]",
    letterClass: "text-white",
  },
];

interface ReviewSourceChipsProps {
  active: ReviewSourceFilter;
  counts: Partial<Record<ReviewSourceFilter, number>>;
  onChange: (id: ReviewSourceFilter) => void;
  showManage?: boolean;
  onManagePress?: () => void;
}

export function ReviewSourceChips({
  active,
  counts,
  onChange,
  showManage = false,
  onManagePress,
}: ReviewSourceChipsProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-1.5 px-4 pb-3.5"
    >
      {PROVIDERS.map((provider) => {
        const count = counts[provider.id] ?? 0;
        // Hide zero-count providers except All and Google (primary).
        if (
          provider.id !== "all" &&
          provider.id !== "google" &&
          count === 0 &&
          active !== provider.id
        ) {
          return null;
        }
        const isOn = active === provider.id;
        return (
          <Pressable
            key={provider.id}
            onPress={() => onChange(provider.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isOn }}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full border px-3 py-1.5",
              isOn
                ? "border-ink bg-ink dark:border-gray-100 dark:bg-gray-100"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
            )}
          >
            {provider.letter ? (
              <View
                className={cn(
                  "h-4 w-4 items-center justify-center rounded",
                  provider.badgeClass,
                )}
              >
                <Text
                  className={cn(
                    "font-geist-extrabold text-[9px]",
                    provider.letterClass,
                  )}
                >
                  {provider.letter}
                </Text>
              </View>
            ) : null}
            <Text
              className={cn(
                "font-geist-semibold text-xs",
                isOn
                  ? "text-white dark:text-ink"
                  : "text-gray-600 dark:text-gray-300",
              )}
            >
              {provider.label}
            </Text>
            <Text
              className={cn(
                "font-geist text-xs",
                isOn
                  ? "text-white/65 dark:text-ink/65"
                  : "text-gray-400 dark:text-gray-500",
              )}
            >
              {count}
            </Text>
          </Pressable>
        );
      })}

      {showManage ? (
        <Pressable
          onPress={onManagePress}
          accessibilityRole="button"
          accessibilityLabel={t("profile.reviews.manageAccounts")}
          className="ml-1 flex-row items-center gap-1 rounded-full bg-[#FFF1E8] px-3 py-1.5 dark:bg-brand/20"
        >
          <Settings size={11} color="#FF6B1A" strokeWidth={2.4} />
          <Text className="font-geist-bold text-xs text-brand">
            {t("profile.reviews.manageAccounts")}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

export const REVIEW_PROVIDER_BADGE: Record<
  ReviewProviderId,
  { label: string; letter: string; badgeClass: string; letterClass: string }
> = {
  google: {
    label: "Google",
    letter: "G",
    badgeClass: "bg-[#4285F4]",
    letterClass: "text-white",
  },
  yelp: {
    label: "Yelp",
    letter: "y",
    badgeClass: "bg-[#D32323]",
    letterClass: "text-white",
  },
  amazon: {
    label: "Amazon",
    letter: "a",
    badgeClass: "bg-[#FF9900]",
    letterClass: "text-white",
  },
  tripadvisor: {
    label: "TripAdvisor",
    letter: "T",
    badgeClass: "bg-[#34E0A1]",
    letterClass: "text-black",
  },
};
