/**
 * Fictional profiles for mock mode only. They never ship to production:
 * the HTTP services read real members from the API.
 * Photos use the `demo:` scheme, drawn as gradients by <ProfilePhoto>.
 */
import type { Profile } from '@/services/types';

const yearsAgo = (y: number, m = 3) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  d.setMonth(m);
  return d.toISOString().slice(0, 10);
};
const demoPhotos = (seed: number, count: number, privateToo = false) => {
  const out: Profile['photos'] = Array.from({ length: count }, (_, i) => ({
    id: `d${seed}-${i}`,
    uri: `demo:${(seed + i) % 8}:${i}`,
    kind: i === 0 ? 'portrait' : 'public',
    moderation: 'approved',
  }));
  if (privateToo) out.push({ id: `d${seed}-p`, uri: `demo:${(seed + 5) % 8}:p`, kind: 'private', moderation: 'approved' });
  return out;
};

type Seed = Omit<Profile, 'photos' | 'isDemo' | 'birthDate'> & { age: number; nPhotos?: number; priv?: boolean };

const seeds: Seed[] = [
  { id: 'grace', firstName: 'Grâce', age: 26, gender: 'f', market: 'CG', city: 'Brazzaville', district: 'Poto-Poto', bio: 'Infirmière. Je danse la rumba le samedi et je cuisine le meilleur saka-saka du quartier.', intention: 'serieux', heightCm: 168, educationRank: 5, languages: ['Français', 'Lingala'], passions: ['Rumba', 'Cuisine', 'Église'], tier: 0, verified: true, distanceKm: 3, prompt: { q: 'Mon dimanche idéal', a: 'Messe le matin, poisson braisé au bord du fleuve l’après-midi.' }, priv: true },
  { id: 'merveille', firstName: 'Merveille', age: 24, gender: 'f', market: 'CD', city: 'Kinshasa', district: 'Gombe', bio: 'Étudiante en droit. Café le matin, ndombolo le soir.', intention: 'on-verra', heightCm: 172, educationRank: 4, languages: ['Français', 'Lingala', 'Anglais'], passions: ['Danse', 'Mode', 'Cinéma'], tier: 2, verified: true, distanceKm: 6, prompt: { q: 'On s’entendra si', a: 'tu sais danser au moins un pas de Fally.' } },
  { id: 'ornella', firstName: 'Ornella', age: 25, gender: 'f', market: 'CG', city: 'Brazzaville', district: 'Bacongo', bio: 'Couturière, je fais mes propres tenues en pagne. Parle-moi de ton plat préféré.', intention: 'serieux', heightCm: 163, educationRank: 3, languages: ['Français', 'Kituba'], passions: ['Mode', 'Musique', 'Cuisine'], tier: 1, verified: true, distanceKm: 5, prompt: { q: 'Mon talent caché', a: 'Je te fais une chemise en wax en une journée.' }, priv: true },
  { id: 'prisca', firstName: 'Prisca', age: 31, gender: 'f', market: 'CD', city: 'Kinshasa', district: 'Ngaliema', bio: 'Entrepreneuse dans la cosmétique. Je cherche quelqu’un de sérieux.', intention: 'mariage', heightCm: 175, educationRank: 6, languages: ['Français', 'Lingala', 'Swahili'], passions: ['Business', 'Voyage'], tier: 3, verified: true, distanceKm: 9, prompt: { q: 'Je cherche', a: 'un homme ambitieux qui respecte la famille.' } },
  { id: 'nadege', firstName: 'Nadège', age: 28, gender: 'f', market: 'CG', city: 'Pointe-Noire', district: 'Tié-Tié', bio: 'Comptable, fan de football et des plages de Pointe-Noire.', intention: 'serieux', heightCm: 160, educationRank: 5, languages: ['Français', 'Kituba'], passions: ['Football', 'Voyage', 'Fleuve'], tier: 0, verified: false, distanceKm: 380, prompt: { q: 'Mon équipe', a: 'Les Diables Rouges, toujours.' } },
  { id: 'divine', firstName: 'Divine', age: 27, gender: 'f', market: 'CD', city: 'Kinshasa', district: 'Limete', bio: 'Je travaille dans la banque. Week-end au bord du fleuve, toujours.', intention: 'serieux', heightCm: 166, educationRank: 6, languages: ['Français', 'Lingala'], passions: ['Fleuve', 'Lecture', 'Gospel'], tier: 0, verified: true, distanceKm: 4, prompt: { q: 'Le meilleur endroit de Kin', a: 'La terrasse de Kinsuka au coucher du soleil.' } },
  { id: 'chancelvie', firstName: 'Chancelvie', age: 23, gender: 'f', market: 'CG', city: 'Brazzaville', district: 'Moungali', bio: 'Étudiante en com. Toujours partante pour un concert à l’IFC.', intention: 'flirt', heightCm: 170, educationRank: 4, languages: ['Français', 'Lingala'], passions: ['Musique', 'Photo', 'Danse'], tier: 0, verified: true, distanceKm: 2, prompt: { q: 'Premier rendez-vous idéal', a: 'Glace à la Corniche puis concert.' } },
  { id: 'exauce', firstName: 'Exaucé', age: 28, gender: 'h', market: 'CG', city: 'Brazzaville', district: 'Talangaï', bio: 'Ingénieur réseau. Guitariste à mes heures.', intention: 'serieux', heightCm: 182, educationRank: 6, languages: ['Français', 'Lingala'], passions: ['Musique', 'Tech', 'Football'], tier: 0, verified: true, distanceKm: 4, prompt: { q: 'Ma chanson du moment', a: 'Un vieux Franco, toujours.' } },
  { id: 'rodrigue', firstName: 'Rodrigue', age: 31, gender: 'h', market: 'CD', city: 'Kinshasa', district: 'Gombe', bio: 'Architecte. J’aime les longues discussions et la bonne musique congolaise.', intention: 'serieux', heightCm: 185, educationRank: 6, languages: ['Français', 'Lingala', 'Anglais'], passions: ['Rumba', 'Voyage'], tier: 2, verified: true, distanceKm: 7, prompt: { q: 'Je me vois avec', a: 'quelqu’un qui rit fort et aime les débats.' } },
  { id: 'junior', firstName: 'Junior', age: 26, gender: 'h', market: 'CD', city: 'Kinshasa', district: 'Lingwala', bio: 'Photographe. Je connais tous les coins de Kin.', intention: 'on-verra', heightCm: 178, educationRank: 3, languages: ['Lingala', 'Français'], passions: ['Photo', 'Ndombolo', 'Mode'], tier: 1, verified: false, distanceKm: 5, prompt: { q: 'Premier rendez-vous idéal', a: 'Balade photo à Matonge puis brochettes.' } },
  { id: 'fiston', firstName: 'Fiston', age: 30, gender: 'h', market: 'CG', city: 'Brazzaville', district: 'Ouenzé', bio: 'Prof de maths. Je cuisine mieux que je n’explique les équations.', intention: 'serieux', heightCm: 176, educationRank: 5, languages: ['Français', 'Kituba', 'Lingala'], passions: ['Cuisine', 'Lecture', 'Basket'], tier: 3, verified: true, distanceKm: 6, prompt: { q: 'Mon dimanche idéal', a: 'Grillades en famille et match de basket.' } },
  { id: 'christ', firstName: 'Christ', age: 29, gender: 'h', market: 'CG', city: 'Brazzaville', district: 'Plateau des 15 ans', bio: 'Sapeur assumé et entrepreneur dans le transport.', intention: 'flirt', heightCm: 180, educationRank: 3, languages: ['Français', 'Lingala'], passions: ['Sape', 'Business', 'Ndombolo'], tier: 2, verified: true, distanceKm: 3, prompt: { q: 'Mon style', a: 'Trois couleurs maximum, la règle d’or de la Sape.' } },
];

export const DEMO_PROFILES: Profile[] = seeds.map(({ age, nPhotos, priv, ...p }, i) => ({
  ...p,
  birthDate: yearsAgo(age, i % 12),
  photos: demoPhotos(i, nPhotos ?? 3 + (i % 2), priv),
  isDemo: true,
}));

/**
 * Official team account. It welcomes members and gives safety tips.
 * It is always shown with the "Équipe CongoMatch" label and never takes part in matching.
 */
export const TEAM_PROFILE: Profile = {
  id: 'team',
  firstName: 'Équipe CongoMatch',
  birthDate: '2000-01-01',
  gender: 'f',
  market: 'CG',
  city: 'Brazzaville',
  bio: 'Compte officiel. Conseils, sécurité et nouveautés.',
  intention: 'amitie',
  languages: ['Français', 'Lingala'],
  passions: [],
  photos: [{ id: 'team-0', uri: 'team:', kind: 'portrait', moderation: 'approved' }],
  tier: 0,
  verified: true,
  isTeam: true,
};

export const DEMO_REPLIES = [
  'Mbote ! 😊 Ça va de ton côté ?',
  'Haha, merci ! Tu fais quoi ce week-end ?',
  'On pourrait prendre un verre au bord du fleuve un de ces jours.',
  'Tu es de quel quartier ?',
  'J’adore ta photo de profil 😄',
];
