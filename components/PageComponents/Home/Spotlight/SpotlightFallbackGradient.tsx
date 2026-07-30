import { LinearGradient } from "expo-linear-gradient";

interface SpotlightFallbackGradientProps {
  colors: readonly [string, string];
}

const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 1 } as const;
const GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

/** The one Spotlight image-load-failure fallback: a flat diagonal two-tone
 * gradient, per card type's own brand colors (matching spotlight-v4's
 * per-card `background` values) — never the generic photo-icon `NoImage`
 * placeholder, which reads as a broken/empty state under a text-over-image
 * scrim rather than a graceful background. */
export function SpotlightFallbackGradient({ colors }: SpotlightFallbackGradientProps) {
  return (
    <LinearGradient
      colors={colors}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={GRADIENT_FILL}
    />
  );
}
