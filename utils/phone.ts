import { getLocales } from "expo-localization";
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import type { RateLimitedErrorBody } from "@/http/account-api/types";

/** Device region (e.g. "US") used to interpret numbers saved without a country code. */
export function getDeviceRegion(): CountryCode | undefined {
  const region = getLocales()[0]?.regionCode?.toUpperCase();
  return region && /^[A-Z]{2}$/.test(region) ? (region as CountryCode) : undefined;
}

/** Region of an E.164 number (e.g. the user's verified phone), if parseable. */
export function getRegionFromE164(e164?: string | null): CountryCode | undefined {
  if (!e164) return undefined;
  return parsePhoneNumberFromString(e164)?.country;
}

/** Returns the E.164 form when `raw` is a valid number, otherwise null. */
export function toE164(raw: string, defaultRegion?: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(raw.trim(), defaultRegion);
  return parsed?.isValid() ? parsed.number : null;
}

/**
 * Validates a national number against the selected country. Returns the E.164
 * form only when the number is valid for that country (e.g. US area code 416 is
 * rejected because it belongs to Canada).
 */
export function validateNationalNumber(raw: string, country: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(raw.trim(), country);
  if (!parsed?.isValid()) return null;
  if (parsed.countryCallingCode !== getCountryCallingCode(country)) return null;
  if (parsed.country && parsed.country !== country) return null;
  return parsed.number;
}

export function formatPhoneForDisplay(e164?: string | null): string {
  if (!e164) return "";
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}

export function maskPhone(e164?: string | null): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  return digits.length < 4 ? "•••" : `•••• ${digits.slice(-4)}`;
}

/** Seconds to wait from a 429 error body, if present. */
export function getRetryAfterSeconds(error: unknown): number | null {
  const value = (error as RateLimitedErrorBody | null)?.data?.retry_after;
  return typeof value === "number" && value > 0 ? value : null;
}

/** Splits a duration into a compact string: "45s", "2m 5s", "1h 2m 5s". Zero-valued parts are omitted. */
export function formatCooldown(
  totalSeconds: number,
  t: (key: string, options: { count: number }) => string,
): string {
  const total = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(t("phoneVerification.durationHours", { count: hours }));
  if (minutes > 0) parts.push(t("phoneVerification.durationMinutes", { count: minutes }));
  if (seconds > 0 || parts.length === 0) {
    parts.push(t("phoneVerification.durationSeconds", { count: seconds }));
  }
  return parts.join(" ");
}
