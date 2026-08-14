/**
 * GuardedFooter geometry. The floating nav bar is the only chrome that occludes
 * page content, so scroll containers derive their bottom padding from these
 * values instead of hardcoding a clearance that drifts when the bar changes.
 */

/** Height of the footer nav bar itself. */
export const FOOTER_BAR_HEIGHT = 64;

/** GuardedFooter's `-bottom-4` — how far the bar hangs past the safe area. */
export const FOOTER_BOTTOM_OVERHANG = 16;

/** Floor for `insets.bottom` on devices without a home indicator. */
export const FOOTER_MIN_INSET = 12;

/** Visible breathing room between the last item and whatever sits below it. */
export const CONTENT_BOTTOM_GAP = 24;
