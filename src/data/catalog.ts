/**
 * Static catalogue shared by the app and (later) the backend seed.
 * Prices are placeholders until the business validates them.
 */

export type TierId = 0 | 1 | 2 | 3;
export type MarketId = 'CG' | 'CD';
export type CountryCode = MarketId | 'CM' | 'AO' | 'TD' | 'CF';
export type Currency = 'XAF' | 'CDF';

export type Country = {
  code: CountryCode;
  name: string;
  flag: string;
  dial: string;
  available: boolean;
  /** main city, used for tier names and default location */
  city?: string;
  placeholder?: string;
};

export const COUNTRIES: Country[] = [
  { code: 'CG', name: 'Congo-Brazzaville', flag: '🇨🇬', dial: '+242', available: true, city: 'Brazzaville', placeholder: '06 612 34 56' },
  { code: 'CD', name: 'RD Congo', flag: '🇨🇩', dial: '+243', available: true, city: 'Kinshasa', placeholder: '81 234 56 78' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dial: '+237', available: false },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dial: '+244', available: false },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩', dial: '+235', available: false },
  { code: 'CF', name: 'Centrafrique', flag: '🇨🇫', dial: '+236', available: false },
];

export const MARKET: Record<MarketId, { city: string; currency: Currency; currencyLabel: string; cities: string[] }> = {
  CG: { city: 'Brazzaville', currency: 'XAF', currencyLabel: 'FCFA', cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Oyo', 'Nkayi'] },
  CD: { city: 'Kinshasa', currency: 'CDF', currencyLabel: 'FC', cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Matadi', 'Kisangani'] },
};

export type Tier = {
  id: Exclude<TierId, 0>;
  name: string;
  /** local badge name by market */
  local: Record<MarketId, string>;
  price: Record<Currency, number>;
  monthlyCoins: number;
  theme: string;
  perks: string[];
};

export const TIERS: Tier[] = [
  {
    id: 1, name: 'Plus', local: { CG: 'Widge', CD: 'Tokoss' }, price: { XAF: 2000, CDF: 9000 }, monthlyCoins: 50, theme: 'Fleuve',
    perks: ['Likes illimités', 'Toutes les photos des profils', 'Revenir sur le dernier profil', '50 pièces offertes chaque mois', 'Thème Fleuve'],
  },
  {
    id: 2, name: 'Gold', local: { CG: 'Ndelet', CD: 'Mopao' }, price: { XAF: 5000, CDF: 22000 }, monthlyCoins: 150, theme: 'Or',
    perks: ['Tout Plus', 'Voir qui vous a liké', 'Filtre géographique (ville, quartier, distance)', 'Notes vocales et mode Incognito', '150 pièces offertes chaque mois', 'Thème Or'],
  },
  {
    id: 3, name: 'Platinum', local: { CG: 'Suspendu', CD: 'Boss' }, price: { XAF: 10000, CDF: 45000 }, monthlyCoins: 400, theme: 'Platine',
    perks: ['Tout Gold', 'Écrire avant le match', 'Profil mis en avant chaque semaine', 'Voir les profils Platinum', '400 pièces offertes chaque mois', 'Thème Platine'],
  },
];

export const tierById = (id: TierId) => TIERS.find((t) => t.id === id);

/** 1 pièce = 10 FCFA ≈ 45 FC. */
export const COIN_VALUE: Record<Currency, number> = { XAF: 10, CDF: 45 };

export type CoinPack = { id: string; coins: number; bonus?: number; price: Record<Currency, number>; tag?: string };
export const PACKS: CoinPack[] = [
  { id: 'p15', coins: 15, price: { XAF: 150, CDF: 700 }, tag: 'Rapide' },
  { id: 'p50', coins: 50, price: { XAF: 500, CDF: 2300 } },
  { id: 'p110', coins: 110, bonus: 10, price: { XAF: 1000, CDF: 4500 } },
  { id: 'p600', coins: 600, bonus: 100, price: { XAF: 5000, CDF: 22500 }, tag: 'Populaire' },
  { id: 'p1250', coins: 1250, bonus: 250, price: { XAF: 10000, CDF: 45000 }, tag: 'Meilleur prix' },
];

export type GiftCategory = 'petits' | 'classe' | 'precieux';
export const GIFT_CATEGORIES: { id: GiftCategory; name: string }[] = [
  { id: 'petits', name: 'Petits gestes' },
  { id: 'classe', name: 'La classe' },
  { id: 'precieux', name: 'Précieux' },
];
export type Gift = { id: string; cat: GiftCategory; name: string; emoji: string; cost: number; fullscreen?: boolean };
export const GIFTS: Gift[] = [
  { id: 'fleur', cat: 'petits', name: 'Fleur', emoji: '🌹', cost: 10 },
  { id: 'pain', cat: 'petits', name: 'Pain chaud', emoji: '🥖', cost: 15 },
  { id: 'mangue', cat: 'petits', name: 'Mangue', emoji: '🥭', cost: 20 },
  { id: 'coeur', cat: 'petits', name: 'Cœur', emoji: '❤️', cost: 25 },
  { id: 'brochette', cat: 'petits', name: 'Brochettes', emoji: '🍢', cost: 30 },
  { id: 'saka', cat: 'petits', name: 'Saka-saka', emoji: '🍲', cost: 40 },
  { id: 'pagne', cat: 'classe', name: 'Pagne wax', emoji: '🧵', cost: 60 },
  { id: 'sape', cat: 'classe', name: 'Tenue de sapeur', emoji: '🎩', cost: 120 },
  { id: 'parfum', cat: 'classe', name: 'Parfum', emoji: '🌸', cost: 150 },
  { id: 'bague', cat: 'classe', name: 'Bague en or', emoji: '💍', cost: 250 },
  { id: 'cobalt', cat: 'precieux', name: 'Cobalt', emoji: '💠', cost: 400 },
  { id: 'or', cat: 'precieux', name: "Lingot d'or", emoji: '🪙', cost: 800 },
  { id: 'diamant', cat: 'precieux', name: 'Diamant', emoji: '💎', cost: 1500 },
  { id: 'voiture', cat: 'precieux', name: 'Voiture de luxe', emoji: '🚘', cost: 5000, fullscreen: true },
];

export type Operator = { id: 'mtn' | 'airtel' | 'orange' | 'mpesa'; name: string; ussd: string; bg: string; fg: string; abbr: string };
export const OPERATORS: Record<MarketId, Operator[]> = {
  CG: [
    { id: 'mtn', name: 'MTN MoMo', ussd: '*105#', bg: '#FFCB05', fg: '#1A1A1A', abbr: 'MTN' },
    { id: 'airtel', name: 'Airtel Money', ussd: '*128#', bg: '#E40000', fg: '#FFFFFF', abbr: 'airtel' },
  ],
  CD: [
    { id: 'mpesa', name: 'M-Pesa', ussd: '*1222#', bg: '#E60000', fg: '#FFFFFF', abbr: 'M-P' },
    { id: 'orange', name: 'Orange Money', ussd: '#144#', bg: '#FF7900', fg: '#111111', abbr: 'OM' },
    { id: 'airtel', name: 'Airtel Money', ussd: '*501#', bg: '#E40000', fg: '#FFFFFF', abbr: 'airtel' },
  ],
};

export type Intention = 'serieux' | 'mariage' | 'flirt' | 'on-verra' | 'amitie';
export const INTENTIONS: { id: Intention; label: string; emoji: string }[] = [
  { id: 'serieux', label: 'Relation sérieuse', emoji: '💍' },
  { id: 'mariage', label: 'Mariage', emoji: '👰🏾' },
  { id: 'flirt', label: 'Flirt', emoji: '😏' },
  { id: 'on-verra', label: 'On verra bien', emoji: '🌊' },
  { id: 'amitie', label: "Amitié d'abord", emoji: '🤝🏾' },
];

/**
 * Education levels by market. `rank` makes the two systems comparable,
 * so a filter set in Brazzaville matches profiles from Kinshasa.
 */
export type Education = { id: string; label: string; rank: number };
export const EDUCATION: Record<MarketId, Education[]> = {
  CG: [
    { id: 'cg-cepe', label: 'CEPE', rank: 1 },
    { id: 'cg-bepc', label: 'BEPC', rank: 2 },
    { id: 'cg-bac', label: 'BAC', rank: 3 },
    { id: 'cg-bts', label: 'BTS / DUT (Bac+2)', rank: 4 },
    { id: 'cg-licence', label: 'Licence (Bac+3)', rank: 5 },
    { id: 'cg-master', label: 'Master (Bac+5)', rank: 6 },
    { id: 'cg-doctorat', label: 'Doctorat', rank: 7 },
  ],
  CD: [
    { id: 'cd-cep', label: "Certificat d'études primaires", rank: 1 },
    { id: 'cd-tronc', label: 'Tronc commun (Brevet)', rank: 2 },
    { id: 'cd-detat', label: "Diplôme d'État", rank: 3 },
    { id: 'cd-g2', label: 'Graduat (G2)', rank: 4 },
    { id: 'cd-g3', label: 'Graduat (G3) / Licence LMD', rank: 5 },
    { id: 'cd-licence', label: 'Licence (L2) / Master', rank: 6 },
    { id: 'cd-doctorat', label: 'Doctorat', rank: 7 },
  ],
};
export const educationLabel = (market: MarketId, rank?: number) =>
  rank ? EDUCATION[market].find((e) => e.rank === rank)?.label ?? '—' : '—';

export const LANGUAGES = ['Français', 'Lingala', 'Kituba', 'Kikongo', 'Swahili', 'Tshiluba', 'Anglais', 'Portugais'];
export const PASSIONS = ['Rumba', 'Ndombolo', 'Cuisine', 'Église', 'Football', 'Basket', 'Mode', 'Sape', 'Musique', 'Voyage', 'Business', 'Lecture', 'Gospel', 'Photo', 'Tech', 'Fleuve', 'Danse', 'Cinéma'];
export const HEIGHT_MIN = 145;
export const HEIGHT_MAX = 205;

export const PASSION_EMOJI: Record<string, string> = {
  Rumba: '💃🏾', Ndombolo: '🕺🏾', Cuisine: '🍲', Église: '⛪', Football: '⚽', Basket: '🏀', Mode: '👠', Sape: '🎩',
  Musique: '🎶', Voyage: '✈️', Business: '💼', Lecture: '📚', Gospel: '🎤', Photo: '📷', Tech: '💻', Fleuve: '🌊',
  Danse: '💃🏾', Cinéma: '🎬',
};
