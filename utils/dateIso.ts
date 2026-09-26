export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  if (!value) return new Date(2000, 0, 1);
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(2000, 0, 1);
  return new Date(year, month - 1, day);
}

export function toDateType(iso: string): Date {
  return parseIsoDate(iso);
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatPeriodLabel(dateFrom: string, dateTo: string): string {
  // Avoid Date.toLocaleString — Hermes can recurse until stack overflow.
  const from = parseIsoDate(dateFrom);
  const to = parseIsoDate(dateTo);
  const fromMonth = SHORT_MONTHS[from.getMonth()];
  const toMonth = SHORT_MONTHS[to.getMonth()];

  if (fromMonth === toMonth) {
    return `${fromMonth} ${from.getDate()}–${to.getDate()}`;
  }

  return `${fromMonth} ${from.getDate()}–${toMonth} ${to.getDate()}`;
}

export function isoFromPickerValue(
  value: Date | string | number | null | undefined,
): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatIsoDate(date);
}
