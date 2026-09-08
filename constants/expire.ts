export type ExpireAfter = '1h' | '24h' | '7d' | '30d' | 'never';

export const EXPIRE_OPTIONS: {
  value: ExpireAfter;
  labelKey: string;
}[] = [
  { value: '1h', labelKey: 'offerForm.expire.1h' },
  { value: '24h', labelKey: 'offerForm.expire.24h' },
  { value: '7d', labelKey: 'offerForm.expire.7d' },
  { value: '30d', labelKey: 'offerForm.expire.30d' },
  { value: 'never', labelKey: 'offerForm.expire.never' },
];
