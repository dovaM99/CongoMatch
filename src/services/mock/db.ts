/**
 * In-memory database for mock mode, saved to AsyncStorage so a dev session
 * survives reloads. Mirrors the tables described in docs/BACKEND.md.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TierId } from '@/data/catalog';
import type { Conversation, LedgerEntry, Message, Payment, Profile, Promo, Session } from '@/services/types';

export type ConversationRow = Omit<Conversation, 'peer' | 'lastMessage' | 'unread'> & { peerId: string };

export type MockDb = {
  session: Session | null;
  pendingOtp: { requestId: string; code: string; phone: string } | null;
  me: Profile | null;
  tier: TierId;
  renewsAt?: string;
  coins: number;
  ledger: LedgerEntry[];
  liked: string[];
  passed: string[];
  blocked: string[];
  conversations: ConversationRow[];
  messages: Message[];
  readUpTo: Record<string, string>;
  promos: Promo[];
  payments: Payment[];
  reports: { profileId: string; reason: string; note?: string; at: string }[];
};

const KEY = 'congomatch.mockdb.v1';

const empty = (): MockDb => ({
  session: null,
  pendingOtp: null,
  me: null,
  tier: 0,
  coins: 0,
  ledger: [],
  liked: [],
  passed: [],
  blocked: [],
  conversations: [],
  messages: [],
  readUpTo: {},
  promos: [],
  payments: [],
  reports: [],
});

export let db: MockDb = empty();
let loaded: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function loadDb() {
  if (!loaded) {
    loaded = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) db = { ...empty(), ...JSON.parse(raw) };
      } catch {
        db = empty();
      }
    })();
  }
  return loaded;
}

export function saveDb() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(db)).catch(() => {});
  }, 150);
}

/** Wipes everything except admin promos, so a demo can restart cleanly. */
export function resetDb() {
  const promos = db.promos;
  db = { ...empty(), promos };
  saveDb();
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
