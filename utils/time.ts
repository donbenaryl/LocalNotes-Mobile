export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatRelativeTimeUpper(dateStr: string): string {
  return formatRelativeTime(dateStr).toUpperCase();
}

export interface FeedTimeGroup {
  /** Stable per bucket: consecutive feed rows with the same id share one header. */
  id: string;
  i18nKey: string;
  params?: Record<string, string | number>;
}

const HOUR_MS = 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Bucket for the Following feed's time headers: hour today, Yesterday, N days, then a date. */
export function getFeedTimeGroup(
  dateStr: string,
  now: Date = new Date(),
  locale?: string,
): FeedTimeGroup {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { id: "unknown", i18nKey: "home.following.time.withinHour" };
  }

  const calendarDays = Math.round((startOfDay(now) - startOfDay(date)) / (24 * HOUR_MS));

  if (calendarDays <= 0) {
    const hours = Math.floor((now.getTime() - date.getTime()) / HOUR_MS);
    if (hours < 1) {
      return { id: "hour-0", i18nKey: "home.following.time.withinHour" };
    }
    return {
      id: `hour-${hours}`,
      i18nKey: "home.following.time.hoursAgo",
      params: { count: hours },
    };
  }

  if (calendarDays === 1) {
    return { id: "yesterday", i18nKey: "home.following.time.yesterday" };
  }

  if (calendarDays < 7) {
    return {
      id: `days-${calendarDays}`,
      i18nKey: "home.following.time.daysAgo",
      params: { count: calendarDays },
    };
  }

  const label = date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
  return {
    id: `date-${startOfDay(date)}`,
    i18nKey: "home.following.time.date",
    params: { date: label },
  };
}

export function isCreatedToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isCreatedWithinHours(dateStr: string, hours: number): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
}

export type TimeOfDayPeriod = "morning" | "afternoon" | "evening" | "night";

export function getTimeOfDayPeriod(date: Date = new Date()): TimeOfDayPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getWeekdayLabel(date: Date = new Date(), locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
}

export function getTimeOfDayLabel(
  translatePeriod: (period: TimeOfDayPeriod) => string,
  date: Date = new Date(),
  locale?: string,
): string {
  const weekday = getWeekdayLabel(date, locale);
  const period = getTimeOfDayPeriod(date);
  return `${weekday} ${translatePeriod(period)}`;
}

export function getEditorialTimePhrase(
  translatePeriod: (period: TimeOfDayPeriod) => string,
  date: Date = new Date(),
): string {
  const period = getTimeOfDayPeriod(date);
  return translatePeriod(period);
}

export function getTimeLeftLabel(expiresAt?: string): string {
  if (!expiresAt) return "No expiration";

  const now = Date.now();
  const expiryDate = new Date(expiresAt);
  const expiry = expiryDate.getTime();
  const diff = expiry - now;

  if (Number.isNaN(expiry)) return "Invalid expiration";
  if (diff <= 0) return "Expired";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `Until ${expiryDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })}`;
  }
  if (hours > 0) return `${hours} hours left`;
  return `${Math.max(minutes, 1)} mins left`;
}
