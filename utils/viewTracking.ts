import type { ViewOrigin } from "@/http/types";

const VIEW_ORIGINS = new Set<ViewOrigin>([
  "search",
  "spotlight",
  "discovery",
  "profile",
  "notification",
  "share_link",
  "smart_pick",
  "recommendation",
  "offer",
  "other",
]);

export function parseViewOrigin(value: string | string[] | null | undefined): ViewOrigin | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && VIEW_ORIGINS.has(candidate as ViewOrigin)
    ? (candidate as ViewOrigin)
    : null;
}

interface ResolveViewOriginOptions {
  explicitOrigin?: ViewOrigin | null;
  pathname: string;
  queryOrigin?: string | string[] | null;
}

export function resolveViewOrigin({
  explicitOrigin,
  pathname,
  queryOrigin,
}: ResolveViewOriginOptions): ViewOrigin {
  if (explicitOrigin) return explicitOrigin;

  const parsedQueryOrigin = parseViewOrigin(queryOrigin);
  if (parsedQueryOrigin) return parsedQueryOrigin;

  if (pathname.includes("/search")) return "search";
  if (pathname.includes("/home/spotlight")) return "spotlight";
  if (pathname.includes("/home/offers")) return "offer";
  if (pathname.includes("/home")) return "discovery";
  if (pathname.includes("/notifications")) return "notification";
  if (pathname.includes("/smart-pick")) return "smart_pick";
  if (
    pathname.includes("/profile") ||
    pathname.includes("/business") ||
    pathname.includes("/saved")
  ) {
    return "profile";
  }

  return "other";
}

export function withViewOrigin(path: string, origin: ViewOrigin): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}origin=${encodeURIComponent(origin)}`;
}
