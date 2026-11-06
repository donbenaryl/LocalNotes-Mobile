import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { useSpotlightBidRound } from '@/hooks/useSpotlightBidRound';
import { useOpenSpotlightBidOnWeb } from '@/hooks/useOpenSpotlightBidOnWeb';
import type { SpotlightBidRoundDAO } from '@/http/spotlight-api/type';

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

export function SpotlightBidCard() {
  const { t } = useTranslation();
  const { round, isLoading, isError } = useSpotlightBidRound();
  const openOnWeb = useOpenSpotlightBidOnWeb();

  const content = renderContent({ round, isLoading, isError, t });

  return (
    <BusinessHomeCard className="mb-1">
      <Pressable
        onPress={openOnWeb}
        accessibilityRole="button"
        accessibilityLabel={t('businessHome.promoteTab.spotlightCta')}
        className="active:opacity-70"
      >
        <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100">
          {content.title}
        </Text>
        {content.meta ? (
          <View className="mt-1 flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-geist text-xs text-gray-500 dark:text-gray-400">
              {content.meta}
            </Text>
            {content.bid ? (
              <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                {content.bid}
              </Text>
            ) : null}
          </View>
        ) : null}
        {content.badge ? (
          <Text
            className={
              content.leading
                ? 'mt-2 font-geist-semibold text-xs text-green-600 dark:text-green-400'
                : 'mt-2 font-geist-semibold text-xs text-amber-600 dark:text-amber-400'
            }
          >
            {content.badge}
          </Text>
        ) : null}
        <Text className="mt-2 font-geist-semibold text-xs text-brand">
          {t('businessHome.promoteTab.spotlightCta')}
        </Text>
      </Pressable>
    </BusinessHomeCard>
  );
}

interface RenderArgs {
  round: SpotlightBidRoundDAO | undefined;
  isLoading: boolean;
  isError: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function renderContent({ round, isLoading, isError, t }: RenderArgs) {
  const p = 'businessHome.promoteTab.';
  if (isLoading) return { title: t(`${p}spotlightLoading`) };
  if (isError || !round) return { title: t(`${p}spotlightUnavailable`) };

  const titleByStatus = {
    open: t(`${p}spotlightStatusOpen`, { city: round.city }),
    awaiting_payment: t(`${p}spotlightStatusAwaitingPayment`, { city: round.city }),
    paid: t(`${p}spotlightStatusPaid`, { city: round.city }),
    no_sponsor: t(`${p}spotlightStatusNoSponsor`, { city: round.city }),
  } as const;

  const meta =
    round.status === 'open'
      ? t(`${p}spotlightCloses`, { when: formatCloses(round.bidding_closes_at) })
      : '';

  const currency = round.my_bid?.currency ?? 'USD';
  const bid =
    round.top_amount_cents === null
      ? t(`${p}spotlightNoBids`)
      : t(`${p}spotlightHighestBid`, {
          amount: formatDollars(round.top_amount_cents, currency),
        });

  let badge = '';
  const myStatus = round.my_bid?.status;
  if (myStatus === 'offered') badge = t(`${p}spotlightWonPayOnWeb`);
  else if (myStatus === 'active')
    badge = round.is_leading ? t(`${p}spotlightLeading`) : t(`${p}spotlightOutbid`);

  return {
    title: titleByStatus[round.status],
    meta: meta || bid,
    bid: meta ? bid : '',
    badge,
    leading: round.is_leading || myStatus === 'offered',
  };
}
