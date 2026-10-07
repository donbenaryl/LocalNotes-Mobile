import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

export interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

export const DEFAULT_COUNTRY: CountryCode = "US";

function toFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0)),
  );
}

function createRegionNamer(locale: string): (code: string) => string {
  try {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return (code) => names.of(code) ?? code;
  } catch {
    // Intl.DisplayNames is unavailable on some engines; fall back to the ISO code.
    return (code) => code;
  }
}

export function buildCountries(locale = "en"): Country[] {
  const nameOf = createRegionNamer(locale);
  return getCountries()
    .map((code) => ({
      code,
      name: nameOf(code),
      dialCode: getCountryCallingCode(code),
      flag: toFlag(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export const COUNTRIES = buildCountries();

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

export function getCountry(code: CountryCode): Country {
  return (
    COUNTRY_BY_CODE.get(code) ?? {
      code,
      name: code,
      dialCode: getCountryCallingCode(code),
      flag: toFlag(code),
    }
  );
}

/** Case-insensitive match on country name, ISO code or dial code (with or without "+"). */
export function filterCountries(query: string): Country[] {
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(q) ||
      country.code.toLowerCase() === q ||
      country.dialCode.startsWith(q),
  );
}
