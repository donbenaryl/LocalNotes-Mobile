import { useTranslation } from 'react-i18next';
import { StatsSection } from '@/components/ui/StatsSection';

interface BusinessHomeToplineProps {
  views: string;
  saves: string;
  redeemed: string;
  lists: string;
}

export function BusinessHomeTopline({
  views,
  saves,
  redeemed,
  lists,
}: BusinessHomeToplineProps) {
  const { t } = useTranslation();

  const stats = [
    { value: views, label: t('businessHome.stats.views') },
    { value: saves, label: t('businessHome.stats.saves') },
    { value: redeemed, label: t('businessHome.stats.redeemed') },
    { value: lists, label: t('businessHome.stats.lists') },
  ];

  return <StatsSection items={stats} className="mx-4 mt-2" />;
}
