import type { ImageSourcePropType } from 'react-native';

export const WELCOME_CREAM = '#F3EBDD';
export const WELCOME_INK = '#1A1714';
export const WELCOME_MATCH_GREEN = '#5DD3A6';
export const WELCOME_SLIDE_INTERVAL_MS = 5000;
export const WELCOME_CROSSFADE_MS = 600;

/** Still used by the force-update screen. */
export const WELCOME_GRADIENT_OVERLAY = require('../assets/welcome/gradient/overlay_gradient.png');

/** @deprecated Prefer WELCOME_SLIDES[0].background — kept for any leftover imports. */
export const WELCOME_BACKGROUND = require('../assets/welcome/carousel/backgrounds/ipanema.jpg');

export const WELCOME_GRADIENT_COLORS = [
  'rgba(26,23,20,0.55)',
  'rgba(26,23,20,0.15)',
  'rgba(26,23,20,0)',
  'rgba(26,23,20,0.5)',
  'rgba(26,23,20,0.9)',
  '#1A1714',
] as const;

export const WELCOME_GRADIENT_LOCATIONS = [0, 0.22, 0.58, 0.68, 0.82, 1] as const;

export type WelcomeListIcon = 'mountain' | 'bridge';

export type WelcomeListRowData = {
  nameKey: string;
  placeKey: string;
  noteKey: string;
  thumb?: ImageSourcePropType;
  icon?: WelcomeListIcon;
};

export type WelcomeListSlideData = {
  kind: 'list';
  eyebrowKey: string;
  titleKey: string;
  titleSize: 'sm' | 'lg';
  curator: {
    nameKey: string;
    matchKey: string;
    avatar: ImageSourcePropType;
  };
  list: {
    titleKey: string;
    picksCountKey: string;
    width: 'narrow' | 'full';
    rows: WelcomeListRowData[];
    moreKey?: string;
  };
};

export type WelcomePickSlideData = {
  kind: 'pick';
  eyebrowKey: string;
  titleKey: string;
  titleSize: 'sm' | 'lg';
  placeNameKey: string;
  curator: {
    nameKey: string;
    matchKey: string;
    avatar: ImageSourcePropType;
  };
  tags: string[];
};

export type WelcomeSmartPicksSlideData = {
  kind: 'smartpicks';
  eyebrowKey: string;
  titleKey: string;
  titleSize: 'sm' | 'lg';
  subtitleKey: string;
  pick: {
    nameKey: string;
    locationKey: string;
    categoryKey: string;
    blurbKey: string;
    matchKey: string;
    savedByKey: string;
    image: ImageSourcePropType;
    savers: { name: string; avatar: ImageSourcePropType }[];
  };
};

export type WelcomeSlideMidData =
  | WelcomeListSlideData
  | WelcomePickSlideData
  | WelcomeSmartPicksSlideData;

export type WelcomeSlide = {
  id: string;
  background: ImageSourcePropType;
  gradientColors: readonly [string, string, ...string[]];
  gradientLocations: readonly [number, number, ...number[]];
  mid: WelcomeSlideMidData;
};

const GRADIENT_SUNSET = [
  'rgba(26,23,20,0.55)',
  'rgba(26,23,20,0.15)',
  'rgba(26,23,20,0)',
  'rgba(26,23,20,0.5)',
  'rgba(26,23,20,0.9)',
  '#1A1714',
] as const;

const GRADIENT_SUNSET_LOCATIONS = [0, 0.22, 0.58, 0.68, 0.82, 1] as const;

const GRADIENT_DATES = [
  'rgba(26,23,20,0.78)',
  'rgba(26,23,20,0.55)',
  'rgba(26,23,20,0.2)',
  'rgba(26,23,20,0.1)',
  'rgba(26,23,20,0.5)',
  'rgba(26,23,20,0.9)',
  '#1A1714',
] as const;

const GRADIENT_DATES_LOCATIONS = [0, 0.2, 0.4, 0.58, 0.68, 0.82, 1] as const;

const GRADIENT_SMARTPICKS = [
  'rgba(26,23,20,0.62)',
  'rgba(26,23,20,0.4)',
  'rgba(26,23,20,0.12)',
  'rgba(26,23,20,0.05)',
  'rgba(26,23,20,0.55)',
  'rgba(26,23,20,0.92)',
  '#1A1714',
] as const;

const GRADIENT_SMARTPICKS_LOCATIONS = [0, 0.22, 0.42, 0.58, 0.68, 0.82, 1] as const;

const AVATAR_MAYA = require('../assets/welcome/carousel/avatars/maya.jpg');
const AVATAR_ED_MARLENE = require('../assets/welcome/carousel/avatars/ed-marlene.jpg');
const AVATAR_ZAID = require('../assets/welcome/carousel/avatars/zaid.jpg');

export const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    id: 'sunset',
    background: require('../assets/welcome/carousel/backgrounds/ipanema.jpg'),
    gradientColors: GRADIENT_SUNSET,
    gradientLocations: GRADIENT_SUNSET_LOCATIONS,
    mid: {
      kind: 'list',
      eyebrowKey: 'auth.welcome.slides.sunset.eyebrow',
      titleKey: 'auth.welcome.slides.sunset.title',
      titleSize: 'sm',
      curator: {
        nameKey: 'auth.welcome.slides.sunset.curatorName',
        matchKey: 'auth.welcome.slides.sunset.match',
        avatar: AVATAR_MAYA,
      },
      list: {
        titleKey: 'auth.welcome.slides.sunset.listTitle',
        picksCountKey: 'auth.welcome.slides.sunset.picksCount',
        width: 'narrow',
        rows: [
          {
            nameKey: 'auth.welcome.slides.sunset.rows.duna.name',
            placeKey: 'auth.welcome.slides.sunset.rows.duna.place',
            noteKey: 'auth.welcome.slides.sunset.rows.duna.note',
            icon: 'mountain',
          },
          {
            nameKey: 'auth.welcome.slides.sunset.rows.arpoador.name',
            placeKey: 'auth.welcome.slides.sunset.rows.arpoador.place',
            noteKey: 'auth.welcome.slides.sunset.rows.arpoador.note',
            thumb: require('../assets/welcome/carousel/thumbs/arpoador.jpg'),
          },
          {
            nameKey: 'auth.welcome.slides.sunset.rows.praca.name',
            placeKey: 'auth.welcome.slides.sunset.rows.praca.place',
            noteKey: 'auth.welcome.slides.sunset.rows.praca.note',
            icon: 'bridge',
          },
        ],
      },
    },
  },
  {
    id: 'dates',
    background: require('../assets/welcome/carousel/backgrounds/riverwalk.jpg'),
    gradientColors: GRADIENT_DATES,
    gradientLocations: GRADIENT_DATES_LOCATIONS,
    mid: {
      kind: 'list',
      eyebrowKey: 'auth.welcome.slides.dates.eyebrow',
      titleKey: 'auth.welcome.slides.dates.title',
      titleSize: 'sm',
      curator: {
        nameKey: 'auth.welcome.slides.dates.curatorName',
        matchKey: 'auth.welcome.slides.dates.match',
        avatar: AVATAR_ED_MARLENE,
      },
      list: {
        titleKey: 'auth.welcome.slides.dates.listTitle',
        picksCountKey: 'auth.welcome.slides.dates.picksCount',
        width: 'full',
        moreKey: 'auth.welcome.slides.dates.showMore',
        rows: [
          {
            nameKey: 'auth.welcome.slides.dates.rows.rooftop.name',
            placeKey: 'auth.welcome.slides.dates.rows.rooftop.place',
            noteKey: 'auth.welcome.slides.dates.rows.rooftop.note',
            thumb: require('../assets/welcome/carousel/thumbs/lh-rooftop.jpg'),
          },
          {
            nameKey: 'auth.welcome.slides.dates.rows.k1.name',
            placeKey: 'auth.welcome.slides.dates.rows.k1.place',
            noteKey: 'auth.welcome.slides.dates.rows.k1.note',
            thumb: require('../assets/welcome/carousel/thumbs/k1-addison.jpg'),
          },
          {
            nameKey: 'auth.welcome.slides.dates.rows.beach.name',
            placeKey: 'auth.welcome.slides.dates.rows.beach.place',
            noteKey: 'auth.welcome.slides.dates.rows.beach.note',
            thumb: require('../assets/welcome/carousel/thumbs/north-ave-beach.jpg'),
          },
        ],
      },
    },
  },
  {
    id: 'cappuccino',
    background: require('../assets/welcome/carousel/backgrounds/cappuccino.jpg'),
    gradientColors: GRADIENT_SUNSET,
    gradientLocations: GRADIENT_SUNSET_LOCATIONS,
    mid: {
      kind: 'pick',
      eyebrowKey: 'auth.welcome.slides.cappuccino.eyebrow',
      titleKey: 'auth.welcome.slides.cappuccino.title',
      titleSize: 'lg',
      placeNameKey: 'auth.welcome.slides.cappuccino.place',
      curator: {
        nameKey: 'auth.welcome.slides.cappuccino.curatorName',
        matchKey: 'auth.welcome.slides.cappuccino.match',
        avatar: AVATAR_ZAID,
      },
      tags: [
        'auth.welcome.slides.cappuccino.tag1',
        'auth.welcome.slides.cappuccino.tag2',
        'auth.welcome.slides.cappuccino.tag3',
      ],
    },
  },
  {
    id: 'smartpicks',
    background: require('../assets/welcome/carousel/backgrounds/red-rock.jpg'),
    gradientColors: GRADIENT_SMARTPICKS,
    gradientLocations: GRADIENT_SMARTPICKS_LOCATIONS,
    mid: {
      kind: 'smartpicks',
      eyebrowKey: 'auth.welcome.slides.smartpicks.eyebrow',
      titleKey: 'auth.welcome.slides.smartpicks.title',
      titleSize: 'lg',
      subtitleKey: 'auth.welcome.slides.smartpicks.subtitle',
      pick: {
        nameKey: 'auth.welcome.slides.smartpicks.pickName',
        locationKey: 'auth.welcome.slides.smartpicks.pickLocation',
        categoryKey: 'auth.welcome.slides.smartpicks.pickCategory',
        blurbKey: 'auth.welcome.slides.smartpicks.pickBlurb',
        matchKey: 'auth.welcome.slides.smartpicks.pickMatch',
        savedByKey: 'auth.welcome.slides.smartpicks.savedBy',
        image: require('../assets/welcome/carousel/thumbs/red-rock.jpg'),
        savers: [
          { name: 'Ed & Marlene', avatar: AVATAR_ED_MARLENE },
          { name: 'Maya', avatar: AVATAR_MAYA },
          { name: 'Zaid', avatar: AVATAR_ZAID },
        ],
      },
    },
  },
];
