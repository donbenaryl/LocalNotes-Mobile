import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CONTENT_BOTTOM_GAP,
  FOOTER_BAR_HEIGHT,
  FOOTER_BOTTOM_OVERHANG,
  FOOTER_MIN_INSET,
} from "@/constants/layout";

/**
 * paddingBottom for a scroll container so its last item clears the GuardedFooter
 * (and the home indicator) with a consistent visible gap.
 *
 * Pass `hasFooter: false` for surfaces the footer is not mounted over — e.g.
 * Profile, which lives in `(app)/(stack)` rather than `(app)/(tabs)`. Those get
 * the same visible gap, just without the bar's height reserved under it.
 */
export function useContentBottomInset(hasFooter = true): number {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, FOOTER_MIN_INSET);
  const occluded = hasFooter
    ? FOOTER_BAR_HEIGHT + bottom - FOOTER_BOTTOM_OVERHANG
    : bottom;
  return occluded + CONTENT_BOTTOM_GAP;
}
