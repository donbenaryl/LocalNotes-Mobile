/** "↑12%" / "↓5%"; empty for null, undefined, zero or non-finite deltas. */
export function formatDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined || !Number.isFinite(delta) || delta === 0) return '';
  return `${delta > 0 ? '↑' : '↓'}${Math.round(Math.abs(delta))}%`;
}

/** The server's `insight_note` when there is something to show, else null. */
export function visibleInsightNote(note: string | null | undefined): string | null {
  if (typeof note !== 'string') return null;
  const trimmed = note.trim();
  return trimmed ? trimmed : null;
}

/**
 * Date label for a chart bucket: "Nov 3" for one-day buckets, "Nov 3 – Nov 5" for wider ones.
 * Returns null when `start` is not a valid date.
 */
export function formatBucketRange(
  start: string | null | undefined,
  bucketDays: number,
  locale: string,
): string | null {
  const from = start ? new Date(start) : null;
  if (!from || Number.isNaN(from.getTime())) return null;
  const fmt = (d: Date) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  const days = Number.isFinite(bucketDays) ? Math.trunc(bucketDays) : 1;
  if (days <= 1) return fmt(from);
  const to = new Date(from);
  to.setDate(to.getDate() + days - 1);
  return `${fmt(from)} – ${fmt(to)}`;
}
