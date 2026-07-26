import { useCallback, useEffect, useRef } from "react";
import { Dimensions, View } from "react-native";
import spotlightService from "@/http/spotlight-api/spotlight.service";

// No FlatList/FlashList viewabilityConfig to reuse here — Spotlight's
// carousels and page are plain `ScrollView`s (§3.5's established
// convention), and no other viewability-tracking utility exists anywhere
// else in the app (confirmed by search before writing this). Polls each
// mounted card's on-screen position via `measureInWindow`, which works the
// same way regardless of which ancestor ScrollView (vertical page or
// horizontal carousel) is moving it, instead of needing scroll-offset math
// wired down from every ancestor.
const POLL_INTERVAL_MS = 300;
const MIN_VISIBLE_RATIO = 0.5;
const MIN_VISIBLE_DURATION_MS = 1000;

/**
 * Logs one Spotlight impression event per continuous viewing session once a
 * card has been >=50% visible for >=1s (plan.md §3.13). Re-arms after the
 * card leaves and re-enters view, matching the backend's own "not deduped
 * per viewer, can be seen multiple times" impression semantics.
 */
export function useSpotlightImpressionTracking(spotlightItemId: string | null) {
  const ref = useRef<View>(null);
  const visibleSinceRef = useRef<number | null>(null);
  const firedForSessionRef = useRef(false);

  const tick = useCallback(() => {
    if (!ref.current || !spotlightItemId) return;

    ref.current.measureInWindow((_x, y, width, height) => {
      if (width <= 0 || height <= 0) return;

      const windowHeight = Dimensions.get("window").height;
      const visibleHeight = Math.min(y + height, windowHeight) - Math.max(y, 0);
      const ratio = Math.max(visibleHeight, 0) / height;

      if (ratio < MIN_VISIBLE_RATIO) {
        visibleSinceRef.current = null;
        firedForSessionRef.current = false;
        return;
      }

      if (visibleSinceRef.current === null) {
        visibleSinceRef.current = Date.now();
        return;
      }

      if (!firedForSessionRef.current && Date.now() - visibleSinceRef.current >= MIN_VISIBLE_DURATION_MS) {
        firedForSessionRef.current = true;
        void spotlightService.logImpression(spotlightItemId);
      }
    });
  }, [spotlightItemId]);

  useEffect(() => {
    if (!spotlightItemId) return;
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [spotlightItemId, tick]);

  return ref;
}
