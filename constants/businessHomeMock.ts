export type BusinessHomeToplineMock = {
  views: number;
  saves: number;
  redeemed: number;
  lists: number;
};

export type BusinessHomeDiscoveryItem = {
  label: string;
  value: string;
};

export type BusinessHomeLocationRow = {
  id: string;
  name: string;
  address: string;
  isViewing: boolean;
  isPaid: boolean;
};

export const BUSINESS_HOME_PERIOD_LABEL = 'Jul 1–28';

export const BUSINESS_HOME_TOPLINE_MOCK: BusinessHomeToplineMock = {
  views: 8400,
  saves: 2100,
  redeemed: 96,
  lists: 47,
};

export const BUSINESS_HOME_DISCOVERY = {
  search: '38%',
  lists: '27%',
  picks: '18%',
  discover: '17%',
  details: [
    { label: '"quiet cafe near me"', value: '430' },
    { label: '"study café"', value: '318' },
    { label: 'Best Study Cafés in Phoenix', value: '820 visits' },
    { label: 'Quiet Corners PHX', value: '430 visits' },
  ] as BusinessHomeDiscoveryItem[],
  insight: '"Best Study Cafés in Phoenix" is currently your strongest List source.',
};

export const BUSINESS_HOME_CAMPAIGN = {
  status: 'Offer · ended 3 days ago',
  name: 'Cardamom bun + cortado, $8 before 10am',
  spend: '$50',
  redeemed: '96',
  sales: '$768',
  roas: '15.4×',
};
