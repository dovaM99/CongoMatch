/**
 * Who can do what, by subscription tier. These rules stay internal: the
 * Forfaits screen lists perks, it does not show this table to members.
 * The backend enforces the same rules; the app only uses them for display.
 */
import type { TierId } from '@/data/catalog';
import type { Profile } from '@/services/types';

export const Rules = {
  dailyFreeLikes: 20,
  canSeeAllPhotos: (t: TierId) => t >= 1,
  canRewind: (t: TierId) => t >= 1,
  canSeeLikers: (t: TierId) => t >= 2,
  canUseGeoFilter: (t: TierId) => t >= 2,
  canSendVoice: (t: TierId) => t >= 2,
  canUseIncognito: (t: TierId) => t >= 2,
  canSeePlatinum: (t: TierId) => t >= 2,
  canMessageBeforeMatch: (t: TierId) => t >= 3,
  /** Private photos are only shown to matches, whatever the tier. */
  canSeePrivatePhotos: (matched: boolean) => matched,
  /**
   * Voice notes in a conversation: either side can send them if one of them
   * has voice in their plan and enabled it for this conversation.
   */
  voiceAvailable: (me: TierId, peer: Profile, unlocked: boolean) => Rules.canSendVoice(me) || unlocked,
  canAskVoice: (me: TierId, peer: Profile) => !Rules.canSendVoice(me) && Rules.canSendVoice(peer.tier),
};

export const MIN_AGE = 18;

export function ageFrom(birthDate: string, now = new Date()): number {
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return 0;
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

/** Parses JJ/MM/AAAA. Returns an ISO date or null. */
export function parseFrDate(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  if (y < 1920) return null;
  return date.toISOString().slice(0, 10);
}
