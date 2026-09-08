export const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type DayHours = {
  open: string | null;
  close: string | null;
};

export type OpeningHours = Partial<Record<WeekdayKey, DayHours>>;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function emptyOpeningHours(): OpeningHours {
  return Object.fromEntries(
    WEEKDAY_KEYS.map((day) => [day, { open: null, close: null }]),
  ) as OpeningHours;
}

export function normalizeOpeningHours(
  value: OpeningHours | null | undefined,
): OpeningHours {
  const base = emptyOpeningHours();
  if (!value || typeof value !== "object") return base;
  for (const day of WEEKDAY_KEYS) {
    const entry = value[day];
    if (!entry || typeof entry !== "object") continue;
    base[day] = {
      open: typeof entry.open === "string" && entry.open ? entry.open : null,
      close: typeof entry.close === "string" && entry.close ? entry.close : null,
    };
  }
  return base;
}

function parseMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Returns an i18n key suffix under editProfile.business, or null if valid. */
export function validateOpeningHours(
  hours: OpeningHours,
): string | null {
  for (const day of WEEKDAY_KEYS) {
    const entry = hours[day] ?? { open: null, close: null };
    const open = entry.open;
    const close = entry.close;
    if (!open && !close) continue;
    if (!open || !close) return "hoursIncomplete";
    const openMinutes = parseMinutes(open);
    const closeMinutes = parseMinutes(close);
    if (openMinutes == null || closeMinutes == null) return "hoursInvalid";
    if (openMinutes >= closeMinutes) return "hoursOrder";
  }
  return null;
}

/** Compact payload for API (omit fully-empty days or keep all — keep all for stable dirty checks). */
export function openingHoursForApi(hours: OpeningHours): OpeningHours {
  const out: OpeningHours = {};
  for (const day of WEEKDAY_KEYS) {
    const entry = hours[day] ?? { open: null, close: null };
    out[day] = {
      open: entry.open || null,
      close: entry.close || null,
    };
  }
  return out;
}

export function areOpeningHoursEqual(
  a: OpeningHours | null | undefined,
  b: OpeningHours | null | undefined,
): boolean {
  const left = normalizeOpeningHours(a);
  const right = normalizeOpeningHours(b);
  return WEEKDAY_KEYS.every((day) => {
    const l = left[day]!;
    const r = right[day]!;
    return l.open === r.open && l.close === r.close;
  });
}

export function formatTimeLabel(value: string | null): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dateFromHhmm(value: string | null): Date {
  const date = new Date();
  if (!value) {
    date.setHours(9, 0, 0, 0);
    return date;
  }
  const [h, m] = value.split(":").map(Number);
  date.setHours(Number.isNaN(h) ? 9 : h, Number.isNaN(m) ? 0 : m, 0, 0);
  return date;
}

export function hhmmFromDate(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
