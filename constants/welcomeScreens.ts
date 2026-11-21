import type { ImageSourcePropType } from 'react-native';

export const WELCOME_ROTATION_INTERVAL_MS = 5000;
export const WELCOME_CROSSFADE_MS = 800;
export const WELCOME_SHORT_SCREEN_HEIGHT = 700;
/** Approx height of bottom headline + subtitle + buttons + legal + padding. */
export const WELCOME_BOTTOM_CHROME_HEIGHT = 340;
export const WELCOME_LIST_CARD_HEIGHT = 185;
export const WELCOME_LOGO_HEIGHT = 28;
export const WELCOME_SCENE_BELOW_LOGO_GAP = 12;

export type WelcomeListRow = {
  thumb: ImageSourcePropType;
  name: string;
  note: string;
};

export type WelcomeListCard = {
  topPt: number;
  title: string;
  count: number;
  rows: WelcomeListRow[];
};

export type WelcomeScreenConfig = {
  id: number;
  background: ImageSourcePropType;
  label: string;
  caption: string;
  captionTopPt: number;
  chip: {
    name: string;
    matchPct: number;
  };
  list: WelcomeListCard | null;
  a11yLabel: string;
};

export const WELCOME_GRADIENT_OVERLAY = require('../assets/welcome/gradient/overlay_gradient.png');

export const WELCOME_SCREENS: WelcomeScreenConfig[] = [
  {
    id: 1,
    background: require('../assets/welcome/backgrounds/screen1_bg.jpg'),
    label: "LENA'S PICK",
    caption: 'Best cortado + study\nspot in town',
    captionTopPt: 100,
    chip: { name: 'Lena', matchPct: 81 },
    list: null,
    a11yLabel: "Example: Lena's pick, 81% match. Best cortado and study spot in town.",
  },
  {
    id: 2,
    background: require('../assets/welcome/backgrounds/screen2_bg.jpg'),
    label: "KENJI'S LIST",
    caption: 'Saved to:\nTaste over ambiance',
    captionTopPt: 83.3,
    chip: { name: 'Kenji', matchPct: 76 },
    list: {
      topPt: 245,
      title: "Kenji's taste-over-ambiance eats",
      count: 9,
      rows: [
        {
          thumb: require('../assets/welcome/thumbnails/27860371.jpg'),
          name: 'Pho Corner',
          note: 'Plastic stools, perfect broth',
        },
        {
          thumb: require('../assets/welcome/thumbnails/13015746.jpg'),
          name: 'Noodle Bar No. 7',
          note: 'Hand-pulled, cash only',
        },
        {
          thumb: require('../assets/welcome/thumbnails/31321820.jpg'),
          name: 'Udon Stand',
          note: 'Fast, cheap, unreal',
        },
      ],
    },
    a11yLabel:
      "Example: Kenji's list, 76% match. Saved to Taste over ambiance.",
  },
  {
    id: 3,
    background: require('../assets/welcome/backgrounds/screen3_bg.jpg'),
    label: "AMARA'S LIST",
    caption: 'Our go-to date spots',
    captionTopPt: 100,
    chip: { name: 'Amara', matchPct: 84 },
    list: null,
    a11yLabel: "Example: Amara's list, 84% match. Our go-to date spots.",
  },
  {
    id: 4,
    background: require('../assets/welcome/backgrounds/screen4_bg.jpg'),
    label: "DIEGO'S LIST",
    caption: 'My sunset list,\nfinally shared',
    captionTopPt: 66.7,
    chip: { name: 'Diego', matchPct: 79 },
    list: {
      topPt: 208,
      title: "Diego's sunset spots",
      count: 6,
      rows: [
        {
          thumb: require('../assets/welcome/thumbnails/36729891.jpg'),
          name: 'Terrace 21',
          note: 'Go at 6, grab the corner',
        },
        {
          thumb: require('../assets/welcome/thumbnails/5054617.jpg'),
          name: 'The Roof Garden',
          note: 'Cheap pints, big views',
        },
        {
          thumb: require('../assets/welcome/thumbnails/final_1.jpg'),
          name: 'Golden Hour Cafe',
          note: 'Coffee till sundown',
        },
      ],
    },
    a11yLabel: "Example: Diego's list, 79% match. My sunset list, finally shared.",
  },
];
