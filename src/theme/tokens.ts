import { TierId } from '@/data/catalog';

export const Fonts = {
  display: 'Unbounded_700Bold',
  displayMedium: 'Unbounded_500Medium',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
};

/** Base palette: a warm night, like Brazzaville seen from the river. */
export const Base = {
  bg: '#0D0A0E',
  bg2: '#150F17',
  surface: '#1C1520',
  surface2: '#261C2B',
  line: 'rgba(255,255,255,0.09)',
  lineStrong: 'rgba(255,255,255,0.18)',
  ink: '#F7EEF2',
  ink2: '#BBA9B2',
  ink3: '#82707A',
  rose: '#FF3D6E',
  roseDeep: '#C2185B',
  ok: '#4CD38A',
  warn: '#F2B33D',
  danger: '#FF5A5F',
  verified: '#4EA8FF',
  scrim: 'rgba(8,5,9,0.72)',
  kente: ['#C2305A', '#F2B33D', '#0F5C5C', '#1F1A17', '#F2B33D', '#E35D3A'],
};

export const Radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export type TierTheme = {
  name: string;
  accent: string;
  accentInk: string;
  /** button and hero gradient stops */
  grad: [string, string, ...string[]];
  /** background wash at the top of each screen */
  wash: [string, string];
  /** tab bar tint over the blur */
  glassTint: string;
  glow: string;
  crest: string;
};

/** The interface changes with the subscription so status reads at a glance. */
export const TierThemes: Record<TierId, TierTheme> = {
  0: {
    name: 'Gratuit',
    accent: '#FF3D6E',
    accentInk: '#FFFFFF',
    grad: ['#FF5A86', '#C2185B'],
    wash: ['rgba(255,61,110,0.22)', 'rgba(13,10,14,0)'],
    glassTint: 'rgba(28,18,26,0.55)',
    glow: 'rgba(255,61,110,0.45)',
    crest: '♥',
  },
  1: {
    name: 'Plus',
    accent: '#3CC8BC',
    accentInk: '#04201D',
    grad: ['#4FE0D2', '#0F7A72'],
    wash: ['rgba(19,128,120,0.32)', 'rgba(13,10,14,0)'],
    glassTint: 'rgba(8,36,34,0.55)',
    glow: 'rgba(60,200,188,0.45)',
    crest: '✦',
  },
  2: {
    name: 'Gold',
    accent: '#E8BE5A',
    accentInk: '#1E1505',
    grad: ['#FBE29A', '#C8901F', '#8A5E0E'],
    wash: ['rgba(200,144,31,0.32)', 'rgba(13,10,14,0)'],
    glassTint: 'rgba(36,26,8,0.6)',
    glow: 'rgba(232,190,90,0.5)',
    crest: '★',
  },
  3: {
    name: 'Platinum',
    accent: '#C9D3E2',
    accentInk: '#0F141B',
    grad: ['#F4F7FB', '#A3AFC2', '#DCE2EA', '#7A879B'],
    wash: ['rgba(154,166,185,0.32)', 'rgba(13,10,14,0)'],
    glassTint: 'rgba(24,28,36,0.6)',
    glow: 'rgba(201,211,226,0.5)',
    crest: '◆',
  },
};
