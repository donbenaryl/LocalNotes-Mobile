import { useTranslation } from 'react-i18next';
import { BusinessHomeStatsGrid } from './ui/BusinessHomeStatsGrid';

export interface BusinessHomeToplineProps {
  views: string;
  saves: string;
  redeemed: string;
  lists: string;
  viewsChange: number;
  savesChange: number;
  redeemedChange: number;
  listsChange: number;
}

export function BusinessHomeTopline({
  views,
  saves,
  redeemed,
  lists,
  viewsChange,
  savesChange,
  redeemedChange,
  listsChange,
}: BusinessHomeToplineProps) {
  const { t } = useTranslation();

  const stats = [
    { value: views, label: t('businessHome.stats.views'), change: viewsChange },
    { value: saves, label: t('businessHome.stats.saves'), change: savesChange },
    { value: redeemed, label: t('businessHome.stats.redeemed'), change: redeemedChange },
    { value: lists, label: t('businessHome.stats.lists'), change: listsChange },
  ];

  return <BusinessHomeStatsGrid items={stats} className="mx-4 mt-2" />;
}
