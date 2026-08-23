import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import type { ClaimStatus } from '@/http/business-api/types';

interface ClaimStatusBadgeProps {
  status: ClaimStatus | string;
  className?: string;
}

const STATUS_CLASS: Record<string, string> = {
  Pending:
    'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  Approved:
    'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
  Rejected: 'bg-rose-100 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
};

const STATUS_TEXT_CLASS: Record<string, string> = {
  Pending: 'text-amber-800 dark:text-amber-300',
  Approved: 'text-emerald-800 dark:text-emerald-300',
  Rejected: 'text-rose-800 dark:text-rose-300',
};

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
  const { t } = useTranslation();
  const key = status in STATUS_CLASS ? status : 'Pending';
  const labelKey =
    key === 'Approved'
      ? 'claimBusiness.status.approved'
      : key === 'Rejected'
        ? 'claimBusiness.status.rejected'
        : 'claimBusiness.status.pending';

  return (
    <View
      className={cn(
        'rounded-md border px-2 py-0.5',
        STATUS_CLASS[key],
        className,
      )}
    >
      <Text
        className={cn(
          'font-geist-semibold text-[11px]',
          STATUS_TEXT_CLASS[key],
        )}
      >
        {t(labelKey)}
      </Text>
    </View>
  );
}
