import { Image, Text, View } from "react-native";
import { BadgeCheck } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { useSpotlightImageFallback } from "@/hooks/useSpotlightImageFallback";
import type { SpotlightBusinessEntityDAO } from "@/http/spotlight-api/type";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { SpotlightFallbackGradient } from "./SpotlightFallbackGradient";

interface SpotlightSponsoredCardProps {
  business: SpotlightBusinessEntityDAO;
}

// Out of scope for §3.13's event-logging wiring: the sponsored slot is a
// `SpotlightSponsoredSlot`, not a `SpotlightItem` — `business.spotlight_item_id`
// is always null here (spotlight/public.py never attaches one for the
// sponsored branch), so the impression/open/save/cta-click endpoints (which
// key on `SpotlightItem.id`) can't be called for it at all. Its own
// impression/visit/save/CTA counters exist on the slot model but aren't
// wired to any endpoint yet (see plan.md §1.10's note on sponsored slots
// being excluded from the weekly stats job for the same reason) — a
// pre-existing backend gap, not something introduced or fixable here.

// Matches spotlight-v4's `.thumb` background exactly.
const FALLBACK_GRADIENT_COLORS = ["#7A4A28", "#C98850"] as const;

export function SpotlightSponsoredCard({ business }: SpotlightSponsoredCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveImageUrl(business.image);
  const { showFallback, onError } = useSpotlightImageFallback(imageUrl);
  const sponsoredTagLabel = t("spotlight.sections.sponsored.tag");

  return (
    <WhiteBox className="mt-2.5 !py-6 flex-row items-center gap-2.5 bg-page p-3 dark:bg-gray-800/60">
      <View className="h-11 w-11 shrink-0 overflow-hidden rounded-[11px]">
        {showFallback ? (
          <SpotlightFallbackGradient colors={FALLBACK_GRADIENT_COLORS} />
        ) : (
          <Image
            source={{ uri: imageUrl as string }}
            className="h-full w-full"
            resizeMode="cover"
            onError={onError}
          />
        )}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1">
          <Text
            className="shrink font-geist-semibold text-lg capitalize text-ink dark:text-gray-100"
            numberOfLines={1}
          >
            {business.name}
          </Text>
          {business.is_verified ? (
            <View role="img" aria-label={t("spotlight.verified")}>
              <BadgeCheck size={12} color="#FF6B1A" />
            </View>
          ) : null}
        </View>

        {/*
          Mockup shows "category · location" — SpotlightBusinessEntityDAO is
          also what the sponsored slot serializes through (public.py's
          build_edition_payload calls serialize_entity(sponsored_slot.business),
          the same Business branch as §3.9's organic Businesses section), and
          it exposes only category, no location/neighborhood field. Omitted
          rather than fabricated, same precedent already documented in
          SpotlightBusinessCard.tsx (§3.9).
        */}
        {business.category ? (
          <Text
            className="mt-0.5 font-geist text-md text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {business.category}
          </Text>
        ) : null}
      </View>

      {/*
        "Sponsored" must be exposed to screen readers, not conveyed by the
        dashed-border styling alone — the pill's accessible text content
        carries the label regardless of the visual border treatment.
      */}
      <View
        className="shrink-0 rounded-md border border-dashed border-gray-400 px-2.5 py-1 dark:border-gray-600"
        role="note"
        aria-label={sponsoredTagLabel}
      >
        <Text className="font-geist-bold text-xs tracking-wide text-gray-700 dark:text-gray-400">
          {sponsoredTagLabel}
        </Text>
      </View>
    </WhiteBox>
  );
}
