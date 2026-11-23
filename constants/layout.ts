/**
 * GuardedFooter geometry. The floating nav bar is the only chrome that occludes
 * page content, so scroll containers derive their bottom padding from these
 * values instead of hardcoding a clearance that drifts when the bar changes.
 */
import { Platform } from 'react-native';

/** Height of the footer nav bar itself. */
export const FOOTER_BAR_HEIGHT = 64;

/**
 * How far the bar hangs past the safe area. iOS only: its home-indicator inset
 * absorbs it. On Android it is negative: the bar is lifted 8px above the system
 * navigation bar so it doesn't sit flush against it.
 */
export const FOOTER_BOTTOM_OVERHANG = Platform.OS === 'android' ? -8 : 16;

/** Floor for `insets.bottom` on devices without a home indicator. */
export const FOOTER_MIN_INSET = 12;

/** Visible breathing room between the last item and whatever sits below it. */
export const CONTENT_BOTTOM_GAP = 24;
