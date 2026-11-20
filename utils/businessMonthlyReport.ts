import type {
  BusinessBriefStatus,
  BusinessMonthlyMetric,
  BusinessMonthlyReportDAO,
} from '@/http/business-api/types';

export const MONTHLY_METRICS: BusinessMonthlyMetric[] = [
  'visitors',
  'savers',
  'recommenders',
  'list_adds',
];

/** "October 2026" from an ISO date. Parsed as a local date so the month never shifts; '' if invalid. */
export function formatReportMonth(monthStart: string | null | undefined, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(monthStart ?? '');
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/** Whole-percent change, e.g. 0.236 -> 24, -0.2 -> -20; null when not comparable. */
export function deltaPercent(change: number | null | undefined): number | null {
  if (change == null || !Number.isFinite(change)) return null;
  const rounded = Math.round(change * 100);
  return rounded === 0 ? 0 : rounded;
}

/** "+24%", "-20%", "0%"; '' when not comparable. */
export function formatDelta(change: number | null | undefined): string {
  const pct = deltaPercent(change);
  if (pct == null) return '';
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

export type MonthlyReportView = 'loading' | 'building' | 'insufficient' | 'report';

export function reportView(report: BusinessMonthlyReportDAO | undefined): MonthlyReportView {
  if (!report) return 'loading';
  const status: BusinessBriefStatus = report.status;
  if (status === 'building') return 'building';
  if (status === 'insufficient_data') return 'insufficient';
  return 'report';
}

/** i18n key for the Analytics row's right-hand text. */
export function rowCopyKey(view: MonthlyReportView): string {
  switch (view) {
    case 'building':
      return 'businessHome.monthlyReport.building';
    case 'insufficient':
      return 'businessHome.monthlyReport.insufficient';
    case 'report':
      return 'businessHome.monthlyReport.ready';
    default:
      return 'businessHome.monthlyReport.loading';
  }
}

/** i18n key for the sheet headline. */
export function headlineKey(status: BusinessBriefStatus): string {
  return status === 'quiet'
    ? 'businessHome.sheets.report.headlineQuiet'
    : 'businessHome.sheets.report.headline';
}
