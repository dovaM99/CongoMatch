/**
 * Mock implementation of every service. Behaviour follows the real product
 * rules so screens can be built and tested before the backend exists.
 * Demo replies come only from fictional demo profiles in this mode.
 */
import { Platform } from 'react-native';

import { DEMO_PROFILES, DEMO_REPLIES, TEAM_PROFILE } from '@/data/demo';
import { GIFTS, MARKET, OPERATORS, PACKS, TIERS, type MarketId } from '@/data/catalog';
import { applyPercent, uid } from '@/lib/format';
import { ageFrom, Rules } from '@/lib/rules';
import type {
  ChatEvent,
  Conversation,
  Message,
  Payment,
  Photo,
  Profile,
  Promo,
  Services,
} from '@/services/types';

import { db, loadDb, resetDb, saveDb, wait } from './db';

const ADMIN_PHONES = (process.env.EXPO_PUBLIC_DEV_ADMIN_PHONES ?? '000000000').split(',').map((s: string) => s.replace(/\D/g, ''));
/** Demo profiles that like you back, so matching can be tested. */
const LIKES_BACK = new Set(['grace', 'merveille', 'prisca', 'divine', 'exauce', 'rodrigue', 'fiston', 'chancelvie', 'christ', 'ornella']);
const LIKED_ME = ['merveille', 'divine', 'chancelvie', 'rodrigue', 'christ'];

const now = () => new Date().toISOString();
async function toDataUrl(blobUrl: string): Promise<string> {
  const blob = await (await fetch(blobUrl)).blob();
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => resolve(blobUrl);
    r.readAsDataURL(blob);
  });
}
const all = () => [...DEMO_PROFILES, TEAM_PROFILE];
const byId = (id: string) => (id === db.me?.id ? db.me : all().find((p) => p.id === id)) ?? null;

/* ---------- moderation results for photos uploaded before the profile exists ---------- */
const reviewed = new Map<string, Photo['moderation']>();
const withReviews = (photos: Photo[]) => photos.map((p) => (reviewed.has(p.id) ? { ...p, moderation: reviewed.get(p.id)! } : p));

/* ---------- events ---------- */
const chatListeners = new Set<(e: ChatEvent) => void>();
const emit = (e: ChatEvent) => chatListeners.forEach((l) => l(e));
const payListeners = new Map<string, Set<(p: Payment) => void>>();
const emitPay = (p: Payment) => payListeners.get(p.id)?.forEach((l) => l({ ...p }));

/* ---------- helpers ---------- */
function toConversation(id: string): Conversation | null {
  const row = db.conversations.find((c) => c.id === id);
  if (!row) return null;
  const peer = byId(row.peerId);
  if (!peer) return null;
  const msgs = db.messages.filter((m) => m.conversationId === id);
  const readAt = db.readUpTo[id] ?? '';
  return {
    id: row.id,
    peer,
    createdAt: row.createdAt,
    voiceUnlocked: row.voiceUnlocked,
    lastMessage: msgs[msgs.length - 1],
    unread: msgs.filter((m) => m.from !== db.me?.id && m.at > readAt).length,
  };
}

function pushMessage(m: Message) {
  db.messages.push(m);
  saveDb();
  emit({ kind: 'message', message: m });
  const c = toConversation(m.conversationId);
  if (c) emit({ kind: 'conversation', conversation: c });
}

function createConversation(peerId: string, opener?: string) {
  const existing = db.conversations.find((c) => c.peerId === peerId);
  if (existing) return existing.id;
  const id = uid('conv');
  db.conversations.push({ id, peerId, createdAt: now(), voiceUnlocked: false });
  if (opener) pushMessage({ id: uid('msg'), conversationId: id, from: peerId, at: now(), status: 'delivered', type: 'text', text: opener });
  saveDb();
  return id;
}

function addLedger(label: string, delta: number) {
  db.coins += delta;
  db.ledger.unshift({ id: uid('led'), label, delta, at: now() });
  saveDb();
}

function demoReply(conversationId: string, peerId: string) {
  const peer = byId(peerId);
  if (!peer?.isDemo) return;
  setTimeout(() => emit({ kind: 'typing', conversationId, typing: true }), 700);
  setTimeout(() => {
    emit({ kind: 'typing', conversationId, typing: false });
    const text = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
    db.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.from === db.me?.id) m.status = 'read';
    });
    pushMessage({ id: uid('msg'), conversationId, from: peerId, at: now(), status: 'delivered', type: 'text', text });
  }, 2200);
}

function seedPromos() {
  if (db.promos.length) return;
  // One example promo with a fixed end time. Reloading the app does not move it.
  const start = new Date();
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  db.promos.push({
    id: uid('promo'),
    title: 'Gold à moitié prix',
    percentOff: 50,
    target: { kind: 'tier', tierId: 2 },
    markets: ['CG', 'CD'],
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    createdBy: 'seed',
    active: true,
  });
  saveDb();
}

const isLive = (p: Promo, t = Date.now()) => p.active && new Date(p.startsAt).getTime() <= t && new Date(p.endsAt).getTime() > t;

/* ---------- services ---------- */
export function createMockServices(): Services {
  const ready = loadDb().then(seedPromos);

  return {
    auth: {
      async requestOtp(country, phone) {
        await ready;
        await wait(600);
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const requestId = uid('otp');
        db.pendingOtp = { requestId, code, phone: `${country}:${phone.replace(/\D/g, '')}` };
        saveDb();
        return { requestId, devCode: code };
      },
      async verifyOtp(requestId, code) {
        await ready;
        await wait(500);
        const p = db.pendingOtp;
        if (!p || p.requestId !== requestId || p.code !== code.trim()) throw new Error('Code incorrect');
        const digits = p.phone.split(':')[1];
        const isNew = !db.me;
        db.session = { userId: db.me?.id ?? uid('user'), token: uid('tok'), isNew, isAdmin: ADMIN_PHONES.includes(digits) };
        db.pendingOtp = null;
        if (isNew) {
          db.coins = 0;
          addLedger('Bonus de bienvenue', 20);
        }
        saveDb();
        return db.session;
      },
      async signOut() {
        resetDb();
      },
    },

    profile: {
      async getMe() {
        await ready;
        return db.me;
      },
      async saveMe(patch) {
        await ready;
        if (patch.birthDate && ageFrom(patch.birthDate) < 18) throw new Error('CongoMatch est réservé aux personnes majeures (18 ans et plus).');
        const base: Profile = db.me ?? {
          id: db.session?.userId ?? uid('user'),
          firstName: '',
          birthDate: '',
          gender: 'h',
          market: 'CG',
          city: 'Brazzaville',
          bio: '',
          intention: 'serieux',
          languages: [],
          passions: [],
          photos: [],
          tier: 0,
          verified: true,
        };
        db.me = { ...base, ...patch, tier: db.tier };
        db.me.photos = withReviews(db.me.photos);
        const isNewTeamConvo = !db.conversations.some((c) => c.peerId === TEAM_PROFILE.id);
        saveDb();
        if (isNewTeamConvo && db.me.firstName) {
          createConversation(
            TEAM_PROFILE.id,
            `Mbote ${db.me.firstName} 👋🏾 Bienvenue sur CongoMatch. Ici c'est le compte officiel de l'équipe. Conseil sécurité : premier rendez-vous dans un lieu public, et ne partage jamais ton code PIN Mobile Money.`,
          );
        }
        return db.me;
      },
      async uploadPhoto(localUri, kind) {
        await ready;
        await wait(400);
        // Web blob: URLs die on reload; keep a data URL so the dev session survives. Production uploads to storage.
        const uri = Platform.OS === 'web' && localUri.startsWith('blob:') ? await toDataUrl(localUri) : localUri;
        const photo: Photo = { id: uid('ph'), uri, kind, moderation: 'pending' };
        // Moderation hook: the photo stays hidden from others until it is approved.
        void this_moderation.reviewPhoto(photo).then((status) => {
          reviewed.set(photo.id, status);
          if (db.me) {
            db.me.photos = withReviews(db.me.photos);
            saveDb();
          }
        });
        return photo;
      },
      async getProfile(id) {
        await ready;
        return byId(id);
      },
    },

    discovery: {
      async getDeck(prefs, viewer) {
        await ready;
        await wait(250);
        const t = db.tier;
        const own = MARKET[viewer.market].city;
        return DEMO_PROFILES.filter((p) => {
          const age = ageFrom(p.birthDate);
          if (db.liked.includes(p.id) || db.passed.includes(p.id) || db.blocked.includes(p.id)) return false;
          if (prefs.seek !== 'tous' && p.gender !== prefs.seek) return false;
          if (age < prefs.ageMin || age > prefs.ageMax) return false;
          if (prefs.intentions.length && !prefs.intentions.includes(p.intention)) return false;
          if (prefs.heightMin && (p.heightCm ?? 0) < prefs.heightMin) return false;
          if (prefs.heightMax && (p.heightCm ?? 999) > prefs.heightMax) return false;
          if (prefs.educationMinRank && (p.educationRank ?? 0) < prefs.educationMinRank) return false;
          if (prefs.languages.length && !p.languages.some((l) => prefs.languages.includes(l))) return false;
          if (prefs.verifiedOnly && !p.verified) return false;
          if (Rules.canUseGeoFilter(t)) {
            if (prefs.cities?.length && !prefs.cities.includes(p.city)) return false;
            if (prefs.maxDistanceKm && (p.distanceKm ?? 0) > prefs.maxDistanceKm) return false;
          }
          return true;
        }).sort((a, b) => Number(b.city === own) - Number(a.city === own) || (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      },
      async like(targetId) {
        await ready;
        db.liked.push(targetId);
        saveDb();
        if (LIKES_BACK.has(targetId)) {
          const conversationId = createConversation(targetId);
          return { matched: true, conversationId };
        }
        return { matched: false };
      },
      async pass(targetId) {
        await ready;
        db.passed.push(targetId);
        saveDb();
      },
      async getLikers() {
        await ready;
        return DEMO_PROFILES.filter((p) => LIKED_ME.includes(p.id) && !db.conversations.some((c) => c.peerId === p.id));
      },
    },

    chat: {
      async list() {
        await ready;
        return db.conversations
          .map((c) => toConversation(c.id))
          .filter((c): c is Conversation => !!c)
          .sort((a, b) => (b.lastMessage?.at ?? b.createdAt).localeCompare(a.lastMessage?.at ?? a.createdAt));
      },
      async messages(conversationId) {
        await ready;
        return db.messages.filter((m) => m.conversationId === conversationId);
      },
      async sendText(conversationId, text) {
        const m: Message = { id: uid('msg'), conversationId, from: db.me!.id, at: now(), status: 'delivered', type: 'text', text };
        pushMessage(m);
        const row = db.conversations.find((c) => c.id === conversationId);
        if (row) demoReply(conversationId, row.peerId);
        return m;
      },
      async sendVoice(conversationId, durationSec, uri) {
        const row = db.conversations.find((c) => c.id === conversationId);
        const peer = row ? byId(row.peerId) : null;
        if (!peer || !Rules.voiceAvailable(db.tier, peer, !!row?.voiceUnlocked)) throw new Error('VOICE_LOCKED');
        const m: Message = { id: uid('msg'), conversationId, from: db.me!.id, at: now(), status: 'delivered', type: 'voice', durationSec, uri };
        pushMessage(m);
        return m;
      },
      async sendGift(conversationId, giftId) {
        const gift = GIFTS.find((g) => g.id === giftId);
        if (!gift) throw new Error('Cadeau inconnu');
        if (db.coins < gift.cost) throw new Error('INSUFFICIENT_COINS');
        const row = db.conversations.find((c) => c.id === conversationId);
        const peer = row ? byId(row.peerId) : null;
        addLedger(`${gift.name} offert${peer ? ` à ${peer.firstName}` : ''}`, -gift.cost);
        const m: Message = { id: uid('msg'), conversationId, from: db.me!.id, at: now(), status: 'delivered', type: 'gift', giftId };
        pushMessage(m);
        if (row) demoReply(conversationId, row.peerId);
        return m;
      },
      async requestVoice(conversationId) {
        const row = db.conversations.find((c) => c.id === conversationId);
        const m: Message = { id: uid('msg'), conversationId, from: db.me!.id, at: now(), status: 'delivered', type: 'voice-request', state: 'pending' };
        pushMessage(m);
        const peer = row ? byId(row.peerId) : null;
        if (row && peer?.isDemo && Rules.canSendVoice(peer.tier)) {
          setTimeout(() => {
            const req = db.messages.find((x) => x.id === m.id);
            if (req && req.type === 'voice-request') req.state = 'accepted';
            row.voiceUnlocked = true;
            saveDb();
            emit({ kind: 'message', message: { ...(req as Message) } });
            pushMessage({ id: uid('msg'), conversationId, from: 'system', at: now(), status: 'delivered', type: 'system', text: `${peer.firstName} a activé les notes vocales pour cette conversation 🎤` });
          }, 2500);
        }
        return m;
      },
      async answerVoiceRequest(messageId, accept) {
        const req = db.messages.find((x) => x.id === messageId);
        if (!req || req.type !== 'voice-request') return;
        req.state = accept ? 'accepted' : 'declined';
        const row = db.conversations.find((c) => c.id === req.conversationId);
        if (row && accept) row.voiceUnlocked = true;
        saveDb();
        emit({ kind: 'message', message: { ...req } });
      },
      async markRead(conversationId) {
        db.readUpTo[conversationId] = now();
        saveDb();
        const c = toConversation(conversationId);
        if (c) emit({ kind: 'conversation', conversation: c });
      },
      subscribe(listener) {
        chatListeners.add(listener);
        return () => chatListeners.delete(listener);
      },
    },

    wallet: {
      async balance() {
        await ready;
        return db.coins;
      },
      async ledger() {
        await ready;
        return db.ledger;
      },
    },

    payments: {
      async initiate({ item, operator, msisdn, promoId }) {
        await ready;
        const market: MarketId = db.me?.market ?? 'CG';
        if (!OPERATORS[market].some((o) => o.id === operator)) throw new Error('Opérateur indisponible dans votre pays');
        const cur = MARKET[market].currency;
        const promo = db.promos.find((p) => p.id === promoId && isLive(p));
        let amount: number;
        if (item.kind === 'tier') amount = TIERS.find((t) => t.id === item.tierId)!.price[cur];
        else amount = PACKS.find((p) => p.id === item.packId)!.price[cur];
        amount = applyPercent(amount, promo?.percentOff);
        const p: Payment = { id: uid('pay'), item, operator, msisdn, amount, currency: cur, promoId: promo?.id, status: 'pending' };
        db.payments.push(p);
        saveDb();
        setTimeout(() => {
          p.status = 'awaiting_pin';
          emitPay(p);
        }, 1200);
        return { ...p };
      },
      watch(paymentId, listener) {
        if (!payListeners.has(paymentId)) payListeners.set(paymentId, new Set());
        payListeners.get(paymentId)!.add(listener);
        return () => payListeners.get(paymentId)?.delete(listener);
      },
      simulateUserAction(paymentId, action) {
        const p = db.payments.find((x) => x.id === paymentId);
        if (!p) return;
        if (action === 'cancel') {
          p.status = 'cancelled';
          saveDb();
          emitPay(p);
          return;
        }
        p.status = 'pending';
        emitPay(p);
        setTimeout(() => {
          p.status = 'succeeded';
          p.providerRef = `TX${Date.now().toString().slice(-8)}`;
          if (p.item.kind === 'tier') {
            const tier = TIERS.find((t) => t.id === (p.item as { tierId: 1 | 2 | 3 }).tierId)!;
            db.tier = tier.id;
            db.renewsAt = new Date(Date.now() + 30 * 86400000).toISOString();
            if (db.me) db.me.tier = tier.id;
            addLedger(`Pièces du forfait ${tier.name}`, tier.monthlyCoins);
          } else {
            const pack = PACKS.find((x) => x.id === (p.item as { packId: string }).packId)!;
            addLedger(`Recharge ${pack.coins + (pack.bonus ?? 0)} pièces`, pack.coins + (pack.bonus ?? 0));
          }
          saveDb();
          emitPay(p);
        }, 1800);
      },
    },

    subscription: {
      async current() {
        await ready;
        return { tier: db.tier, renewsAt: db.renewsAt };
      },
    },

    promos: {
      async listActive(market) {
        await ready;
        return db.promos.filter((p) => isLive(p) && p.markets.includes(market));
      },
      async listAll() {
        await ready;
        return [...db.promos].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
      },
      async create(input) {
        await ready;
        if (!db.session?.isAdmin && !__DEV__) throw new Error('Réservé aux administrateurs');
        if (input.percentOff <= 0 || input.percentOff >= 100) throw new Error('Pourcentage invalide');
        if (new Date(input.endsAt) <= new Date(input.startsAt)) throw new Error('La fin doit être après le début');
        const promo: Promo = { ...input, id: uid('promo'), createdBy: db.session?.userId ?? 'dev', active: true };
        db.promos.push(promo);
        saveDb();
        return promo;
      },
      async end(promoId) {
        const p = db.promos.find((x) => x.id === promoId);
        if (p) {
          p.active = false;
          saveDb();
        }
      },
    },

    moderation: this_moderation,
  };
}

const this_moderation: Services['moderation'] = {
  async report(profileId, reason, note) {
    db.reports.push({ profileId, reason, note, at: now() });
    saveDb();
  },
  async block(profileId) {
    db.blocked.push(profileId);
    db.conversations = db.conversations.filter((c) => c.peerId !== profileId);
    saveDb();
  },
  async reviewPhoto(photo) {
    // Production: automatic nudity/minor detection, then a human queue for private photos.
    await wait(photo.kind === 'private' ? 6000 : 2500);
    return 'approved';
  },
};
