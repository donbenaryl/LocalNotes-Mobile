import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useOpenSpotlightBidOnWeb } from '@/hooks/useOpenSpotlightBidOnWeb';
import { useSpotlightBidRound } from '@/hooks/useSpotlightBidRound';
import type { SpotlightBidRoundDAO } from '@/http/spotlight-api/type';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';

interface BusinessHomeSpotlightPageProps {
  onBack: () => void;
}

function formatDollars(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount)}`;
  }
}

function formatCloses(iso: string): string {
  const closes = new Date(iso);
  if (Number.isNaN(closes.getTime())) return '';
  return closes.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(
  round: SpotlightBidRoundDAO | undefined,
  isLoading: boolean,
  isError: boolean,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const p = 'businessHome.promoteTab.';
  if (isLoading) return t(`${p}spotlightLoading`);
  if (isError || !round) return t(`${p}spotlightUnavailable`);
  if (round.status === 'open') {
    return t(`${p}spotlightCloses`, {
      when: formatCloses(round.bidding_closes_at),
    });
  }
  const titleByStatus = {
    awaiting_payment: t(`${p}spotlightStatusAwaitingPayment`, {
      city: round.city,
    }),
    paid: t(`${p}spotlightStatusPaid`, { city: round.city }),
    no_sponsor: t(`${p}spotlightStatusNoSponsor`, { city: round.city }),
  } as const;
  return titleByStatus[round.status] ?? t(`${p}spotlightUnavailable`);
}

function highestBidLabel(
  round: SpotlightBidRoundDAO | undefined,
  isLoading: boolean,
  isError: boolean,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const p = 'businessHome.promoteTab.';
  if (isLoading || isError || !round) return '—';
  if (round.top_amount_cents === null) return t(`${p}spotlightNoBids`);
  const currency = round.my_bid?.currency ?? 'USD';
  return formatDollars(round.top_amount_cents, currency);
}

export function BusinessHomeSpotlightPage({
  onBack,
}: BusinessHomeSpotlightPageProps) {
  const { t } = useTranslation();
  const { round, isLoading, isError } = useSpotlightBidRound();
  const openOnWeb = useOpenSpotlightBidOnWeb();

  const myStatus = round?.my_bid?.status;
  let badge = '';
  if (myStatus === 'offered') {
    badge = t('businessHome.promoteTab.spotlightWonPayOnWeb');
  } else if (myStatus === 'active') {
    badge = round?.is_leading
      ? t('businessHome.promoteTab.spotlightLeading')
      : t('businessHome.promoteTab.spotlightOutbid');
  }
  const leading = Boolean(round?.is_leading || myStatus === 'offered');

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.spotlight')}
      onBack={onBack}
    >
      <View className="mt-2 px-4">
        <View className="mb-3 self-start rounded-full bg-brand-tint px-2.5 py-1">
          <Text className="font-geist-bold text-[11px] text-brand dark:text-dk-text">
            {statusLabel(round, isLoading, isError, t)}
          </Text>
        </View>
        <Text className="font-geist-extrabold text-lg text-ink dark:text-dk-text">
          {t('businessHome.spotlightPage.title')}
        </Text>
        <Text className="mt-2 font-geist text-xs leading-[1.5] text-gray-500 dark:text-dk-muted">
          {t('businessHome.spotlightPage.body')}
        </Text>
      </View>

      <BusinessHomeCard className="mt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-geist-semibold text-xs text-gray-500 dark:text-dk-muted">
            {t('businessHome.spotlightPage.highestBid')}
          </Text>
          <Text className="font-geist-extrabold text-base text-ink dark:text-dk-text">
            {highestBidLabel(round, isLoading, isError, t)}
          </Text>
        </View>
        {badge ? (
          <Text
            className={
              leading
                ? 'mt-2 font-geist-semibold text-xs text-green-600 dark:text-green-400'
                : 'mt-2 font-geist-semibold text-xs text-amber-600 dark:text-amber-400'
            }
          >
            {badge}
          </Text>
        ) : null}
      </BusinessHomeCard>

      <View className="mt-4 px-4">
        <LocalNotesButton
          label={t('businessHome.spotlightPage.placeBid')}
          onPress={openOnWeb}
          variant="brand"
          size="sm"
        />
      </View>
    </BusinessHomeDetailShell>
  );
}
