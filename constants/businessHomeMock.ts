export type BusinessHomeToplineMock = {
  views: number;
  saves: number;
  redeemed: number;
  lists: number;
};

export type BusinessHomeActivityRow = {
  title: string;
  meta: string;
  highlight?: boolean;
};

export type BusinessHomeDiscoveryItem = {
  label: string;
  value: string;
};

export type BusinessHomeLocationRow = {
  name: string;
  savesLabel: string;
  highlight?: 'green' | 'warn';
  isViewing?: boolean;
};

export type BusinessHomeExploreChip = {
  label: string;
  count: string;
  hot?: boolean;
};

export type BusinessHomeDemandRow = {
  query: string;
  meta: string;
  highlight?: boolean;
};

export type BusinessHomePerformanceRow = {
  title: string;
  meta: string;
};

export const BUSINESS_HOME_PERIOD_LABEL = 'Jul 1–28';

export const BUSINESS_HOME_TOPLINE_MOCK: BusinessHomeToplineMock = {
  views: 8400,
  saves: 2100,
  redeemed: 96,
  lists: 47,
};

export const BUSINESS_HOME_BRIEF = {
  periodLabel: 'Jul 1–28',
  body:
    'Your Saturday service plan is holding — mentions down 3 → 1 — and the cardamom bun test confirmed real demand. Late-hour searches keep rising.',
  nextMove: 'Promote the bun while the Saturday fix finishes.',
};

export const BUSINESS_HOME_ACTIVITY_ROWS: BusinessHomeActivityRow[] = [
  { title: 'Sarah confirmed weekend hours', meta: '9:42 AM' },
  { title: 'Danae R. picked you', meta: '2d' },
  { title: 'You joined "Best study cafés in Phoenix"', meta: '2.1K saves', highlight: true },
];

export const BUSINESS_HOME_ALERT = {
  title: 'Weekend hours are unconfirmed',
  body: 'This may reduce Saturday discovery.',
  saturdayHours: '7:00 AM – 4:00 PM',
  sundayHours: '7:00 AM – 3:00 PM',
};

export const BUSINESS_HOME_ACTIVE_PLAN = {
  title: 'Saturday staffing review · day 12 of 28',
  subtitle: 'On track — mentions down 3 → 1.',
};

export const BUSINESS_HOME_ACTION_PLAN = {
  title: 'Promote the cardamom bun',
  summary:
    'Your +20% test confirmed demand — sell-out moved from 8:40 to 10:15am.',
  priority: '1',
  effort: 'Low',
  confidence: 'High',
  evidence:
    'Completed test: units +19%, zero waste days, mentions 3 → 6. Demand is proven — the open question is how far it reaches.',
  source: 'Jul 1–28 · 32 public pick notes',
  recommendedStep:
    'Run a morning Offer aimed at study & quiet-list savers — your proven audience.',
  measure: 'Verified redemptions · tracked sales · sell-out time.',
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

export const BUSINESS_HOME_LOCATIONS_MOCK: BusinessHomeLocationRow[] = [
  { name: 'Roosevelt Row', savesLabel: '2.1K saves · +34%', highlight: 'green', isViewing: true },
  { name: 'Tempe', savesLabel: '880 saves · +6%' },
  { name: 'Scottsdale', savesLabel: '640 saves · −3% ⚠', highlight: 'warn' },
];

export const BUSINESS_HOME_EXPLORE_CHIPS: BusinessHomeExploreChip[] = [
  { label: 'quiet', count: '14', hot: true },
  { label: 'cortado', count: '11', hot: true },
  { label: 'cozy', count: '9' },
  { label: 'wifi', count: '8' },
];

export const BUSINESS_HOME_DIFF_CHIPS: BusinessHomeExploreChip[] = [
  { label: 'taste over looks', count: '1.8×', hot: true },
  { label: 'quiet over lively', count: '1.6×', hot: true },
  { label: 'regulars over novelty', count: '1.4×' },
];

export const BUSINESS_HOME_DEMAND_ROWS: BusinessHomeDemandRow[] = [
  { query: '"study spots open late"', meta: '310 · ↑18%', highlight: true },
  { query: '"quiet cafe near me"', meta: '480' },
];

export const BUSINESS_HOME_PERFORMANCE_ROWS: BusinessHomePerformanceRow[] = [
  { title: 'Audience fit 87% vs café avg 61%', meta: 'Top 5%' },
  { title: 'Views → saves 25% vs 9%', meta: 'Top 10%' },
  { title: 'Visit intent · directions requested', meta: '640 · ↑9%' },
];

export const BUSINESS_HOME_USAGE =
  'This month: 41/60 Copilot questions · 3/12 campaign drafts · shared across your team · we\'ll warn you at 80%, never silently charge';

export const BUSINESS_HOME_PROFILE_HEALTH = {
  score: 82,
  gaps: '2 gaps: confirm weekend hours · add an exterior photo. Complete profiles surface better in search — fixing them is always free, no AI needed.',
};
