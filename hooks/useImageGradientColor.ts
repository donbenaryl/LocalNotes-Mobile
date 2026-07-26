import { useEffect, useState } from "react";
import { getColors, type ImageColorsResult } from "react-native-image-colors";

/** Spotlight-style fallback when extraction fails or the native module is unavailable. */
export const FALLBACK_GRADIENT_RGB = { r: 10, g: 7, b: 4 } as const;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const colorCache = new Map<string, RgbColor>();

function parseHex(hex: string): RgbColor | null {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6 && normalized.length !== 8) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

function darken(rgb: RgbColor, factor = 0.45): RgbColor {
  return {
    r: Math.round(rgb.r * factor),
    g: Math.round(rgb.g * factor),
    b: Math.round(rgb.b * factor),
  };
}

function pickHexFromResult(result: ImageColorsResult): string | null {
  switch (result.platform) {
    case "android":
      return (
        result.darkMuted ??
        result.darkVibrant ??
        result.dominant ??
        result.average ??
        null
      );
    case "web":
      return (
        result.darkMuted ??
        result.darkVibrant ??
        result.dominant ??
        null
      );
    case "ios":
      return result.background ?? result.primary ?? result.detail ?? null;
    default:
      return null;
  }
}

export function toRgba(rgb: RgbColor, alpha: number): string {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

/**
 * Extracts a darkened tint from an image URI for bottom hero gradients.
 * Falls back to Spotlight-style dark brown when extraction fails (e.g. Expo Go).
 */
export function useImageGradientColor(imageUrl: string | null | undefined): RgbColor {
  const [color, setColor] = useState<RgbColor>(() => {
    if (imageUrl && colorCache.has(imageUrl)) {
      return colorCache.get(imageUrl)!;
    }
    return FALLBACK_GRADIENT_RGB;
  });

  useEffect(() => {
    if (!imageUrl) {
      setColor(FALLBACK_GRADIENT_RGB);
      return;
    }

    const cached = colorCache.get(imageUrl);
    if (cached) {
      setColor(cached);
      return;
    }

    let cancelled = false;

    getColors(imageUrl, {
      fallback: "#0A0704",
      cache: true,
      key: imageUrl,
    })
      .then((result) => {
        if (cancelled) return;
        const hex = pickHexFromResult(result);
        const parsed = hex ? parseHex(hex) : null;
        const next = parsed ? darken(parsed) : FALLBACK_GRADIENT_RGB;
        colorCache.set(imageUrl, next);
        setColor(next);
      })
      .catch(() => {
        if (cancelled) return;
        colorCache.set(imageUrl, FALLBACK_GRADIENT_RGB);
        setColor(FALLBACK_GRADIENT_RGB);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}
