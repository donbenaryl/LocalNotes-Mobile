import type {
  BusinessAlertCta,
  BusinessAlertDAO,
  BusinessAlertsDAO,
} from '@/http/business-api/types';

/** Minimal i18n surface, so the helpers below stay pure and testable without react-i18next. */
export type AlertTranslate = (key: string, options?: Record<string, unknown>) => string;
export type AlertKeyExists = (key: string) => boolean;

const COPY = 'businessHome.alert';
const MAX_LISTED_DETAILS = 2;

/** Alert query key, shared by the hook and anything that invalidates it. */
export function businessAlertsQueryKey(businessId: string) {
  return ['business-alerts', businessId] as const;
}

// ---------------------------------------------------------------------------
// CTA -> action
// ---------------------------------------------------------------------------

export type BusinessAlertAction =
  | { kind: 'create_offer_web' }
  | { kind: 'edit_profile' }
  | { kind: 'edit_hours' }
  | { kind: 'thank_you' }
  | { kind: 'open_customers' }
  | { kind: 'open_campaign' }
  | { kind: 'none' };

const ACTION_BY_CTA: Record<BusinessAlertCta, BusinessAlertAction> = {
  create_offer_web: { kind: 'create_offer_web' },
  edit_profile: { kind: 'edit_profile' },
  thank_you: { kind: 'thank_you' },
  open_customers: { kind: 'open_customers' },
  open_campaign: { kind: 'open_campaign' },
};

const NO_ACTION: BusinessAlertAction = { kind: 'none' };

/**
 * What the primary button does. An unknown or missing CTA is a safe no-op (the card then
 * shows no primary button) so a newer backend can never crash an older app.
 */
export function resolveAlertAction(
  alert: Pick<BusinessAlertDAO, 'alert_type' | 'cta' | 'params'>,
): BusinessAlertAction {
  if (!alert.cta) return NO_ACTION;
  const action = Object.prototype.hasOwnProperty.call(ACTION_BY_CTA, alert.cta)
    ? ACTION_BY_CTA[alert.cta]
    : undefined;
  if (!action) return NO_ACTION;

  if (
    action.kind === 'edit_profile' &&
    alert.alert_type === 'profile_incomplete' &&
    alert.params?.gaps?.some((gap) => gap.group === 'hours')
  ) {
    return { kind: 'edit_hours' };
  }
  return action;
}

// ---------------------------------------------------------------------------
// Copy (keys come from the backend; the words live in locales/en.ts)
// ---------------------------------------------------------------------------

export type BusinessAlertCopy = { what: string; why: string; action: string };

type CopyPart = 'what' | 'why' | 'action';

function copyKey(part: CopyPart, key: string, exists: AlertKeyExists): string {
  const specific = `${COPY}.${part}.${key}`;
  return key && exists(specific) ? specific : `${COPY}.${part}.fallback`;
}

function describeGap(
  gap: { group: string; missing?: string[] },
  businessType: string,
  t: AlertTranslate,
  exists: AlertKeyExists,
): string | null {
  if (gap.group !== 'importantInfo') {
    const key = `businessHome.profileHealth.gap.${gap.group}`;
    return exists(key) ? t(key) : null;
  }
  const missing = gap.missing ?? [];
  if (missing.length === 0) return null;
  if (missing.length > MAX_LISTED_DETAILS) {
    return t('businessHome.profileHealth.gap.importantInfoMany', {
      count: missing.length,
      type: businessType.toLowerCase(),
    });
  }
  return t('businessHome.profileHealth.gap.importantInfo', {
    items: missing.map((label) => label.toLowerCase()).join(', '),
  });
}

/** Interpolation values for the alert templates. Unknown metrics and themes get generic labels. */
export function buildAlertParams(
  alert: Pick<BusinessAlertDAO, 'params'>,
  t: AlertTranslate,
  exists: AlertKeyExists,
  businessType = '',
): Record<string, unknown> {
  const p = alert.params ?? {};

  const metricKey = `${COPY}.metric.${p.metric}`;
  const termKey = `${COPY}.concern.theme.${p.term}`;
  const gapLabels = (p.gaps ?? [])
    .map((gap) => describeGap(gap, businessType, t, exists))
    .filter((label): label is string => Boolean(label));

  return {
    metric: t(p.metric && exists(metricKey) ? metricKey : `${COPY}.metric.other`),
    delta: typeof p.delta_pct === 'number' ? Math.abs(Math.round(p.delta_pct)) : 0,
    term: t(p.term && exists(termKey) ? termKey : `${COPY}.concern.theme.other`),
    list_name: p.list_name ?? '',
    city: p.city ?? '',
    campaign: p.campaign ?? '',
    engagement: p.engagement ?? 0,
    count: p.count ?? 0,
    gaps: gapLabels.join(', '),
  };
}

/** What happened -> why it matters -> what to do, with a generic fallback for unknown keys. */
export function resolveAlertCopy(
  alert: BusinessAlertDAO,
  t: AlertTranslate,
  exists: AlertKeyExists,
  businessType = '',
): BusinessAlertCopy {
  const params = buildAlertParams(alert, t, exists, businessType);
  return {
    what: t(copyKey('what', alert.what_key, exists), params),
    why: t(copyKey('why', alert.why_key, exists), params),
    action: t(copyKey('action', alert.action_key, exists), params),
  };
}

// ---------------------------------------------------------------------------
// Cache transforms (optimistic read / dismiss)
// ---------------------------------------------------------------------------

/** Marks one alert read and lowers `unread_count` once. Unknown or already-read ids change nothing. */
export function markAlertReadInCache(
  data: BusinessAlertsDAO | undefined,
  alertId: string,
  readAt: string,
): BusinessAlertsDAO | undefined {
  if (!data) return data;
  const target = data.alerts.find((alert) => alert.id === alertId);
  if (!target || target.read_at) return data;
  return {
    unread_count: Math.max(0, data.unread_count - 1),
    alerts: data.alerts.map((alert) =>
      alert.id === alertId ? { ...alert, read_at: readAt } : alert,
    ),
  };
}

/** Drops a dismissed alert; lowers `unread_count` only if it was unread. */
export function removeAlertFromCache(
  data: BusinessAlertsDAO | undefined,
  alertId: string,
): BusinessAlertsDAO | undefined {
  if (!data) return data;
  const target = data.alerts.find((alert) => alert.id === alertId);
  if (!target) return data;
  return {
    unread_count: target.read_at ? data.unread_count : Math.max(0, data.unread_count - 1),
    alerts: data.alerts.filter((alert) => alert.id !== alertId),
  };
}

/** Rollback after a failed mutation: the snapshot taken in `onMutate`, else whatever is cached. */
export function restoreAlertsSnapshot(
  current: BusinessAlertsDAO | undefined,
  snapshot: BusinessAlertsDAO | undefined,
): BusinessAlertsDAO | undefined {
  return snapshot ?? current;
}

/** Ids still unread, used to mark a visible section read in one pass. */
export function unreadAlertIds(data: BusinessAlertsDAO | undefined): string[] {
  return data?.alerts.filter((alert) => !alert.read_at).map((alert) => alert.id) ?? [];
}
