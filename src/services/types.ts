/**
 * Contracts between the app and the backend.
 * Screens only talk to these interfaces. `mock/` implements them in memory for
 * development; `http/` will implement them against the real API.
 */
import type { CountryCode, Intention, MarketId, Operator, TierId } from '@/data/catalog';

export type Gender = 'h' | 'f';
export type Seek = Gender | 'tous';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';
/**
 * portrait: first photo, face visible, required.
 * public: other gallery photos.
 * private: only shown to matches, needs 18+ and moderation.
 */
export type PhotoKind = 'portrait' | 'public' | 'private';
export type Photo = { id: string; uri: string; kind: PhotoKind; moderation: ModerationStatus };

export type Profile = {
  id: string;
  firstName: string;
  /** ISO date, used for the 18+ check */
  birthDate: string;
  gender: Gender;
  market: MarketId;
  city: string;
  district?: string;
  bio: string;
  intention: Intention;
  heightCm?: number;
  educationRank?: number;
  languages: string[];
  passions: string[];
  photos: Photo[];
  tier: TierId;
  verified: boolean;
  /** Official CongoMatch team or ambassador account, always labelled as such. */
  isTeam?: boolean;
  /** Fictional profile that only exists in mock mode. */
  isDemo?: boolean;
  prompt?: { q: string; a: string };
  distanceKm?: number;
  lastActiveAt?: string;
};

export type Preferences = {
  seek: Seek;
  ageMin: number;
  ageMax: number;
  intentions: Intention[];
  heightMin?: number;
  heightMax?: number;
  educationMinRank?: number;
  languages: string[];
  verifiedOnly: boolean;
  /** Gold and above */
  cities?: string[];
  /** Gold and above */
  maxDistanceKm?: number;
};

export type Session = { userId: string; token: string; isNew: boolean; isAdmin: boolean };

export interface AuthService {
  /** Sends an SMS code. In mock mode `devCode` is returned so the flow can be tested. */
  requestOtp(country: CountryCode, phone: string): Promise<{ requestId: string; devCode?: string }>;
  verifyOtp(requestId: string, code: string): Promise<Session>;
  signOut(): Promise<void>;
}

export interface ProfileService {
  getMe(): Promise<Profile | null>;
  saveMe(patch: Partial<Profile>): Promise<Profile>;
  /** Uploads to media storage and queues the photo for moderation. */
  uploadPhoto(localUri: string, kind: PhotoKind): Promise<Photo>;
  getProfile(id: string): Promise<Profile | null>;
}

export type LikeResult = { matched: boolean; conversationId?: string };

export interface DiscoveryService {
  getDeck(prefs: Preferences, viewer: Profile): Promise<Profile[]>;
  like(targetId: string): Promise<LikeResult>;
  pass(targetId: string): Promise<void>;
  /** Profiles that liked the viewer (visible from Gold). */
  getLikers(): Promise<Profile[]>;
}

export type MessageBase = { id: string; conversationId: string; from: string; at: string; status: 'sent' | 'delivered' | 'read' };
export type Message =
  | (MessageBase & { type: 'text'; text: string })
  | (MessageBase & { type: 'voice'; durationSec: number; uri?: string })
  | (MessageBase & { type: 'gift'; giftId: string })
  | (MessageBase & { type: 'voice-request'; state: 'pending' | 'accepted' | 'declined' })
  | (MessageBase & { type: 'system'; text: string });

export type Conversation = {
  id: string;
  peer: Profile;
  createdAt: string;
  lastMessage?: Message;
  unread: number;
  /** true when the higher-tier member enabled voice notes for this conversation */
  voiceUnlocked: boolean;
};

export interface ChatService {
  list(): Promise<Conversation[]>;
  messages(conversationId: string): Promise<Message[]>;
  sendText(conversationId: string, text: string): Promise<Message>;
  sendVoice(conversationId: string, durationSec: number, localUri?: string): Promise<Message>;
  sendGift(conversationId: string, giftId: string): Promise<Message>;
  /** Asks the peer (who has voice notes in their plan) to enable them for this conversation. */
  requestVoice(conversationId: string): Promise<Message>;
  answerVoiceRequest(messageId: string, accept: boolean): Promise<void>;
  markRead(conversationId: string): Promise<void>;
  /** Live updates (WebSocket in production). Returns an unsubscribe function. */
  subscribe(listener: (event: ChatEvent) => void): () => void;
}
export type ChatEvent =
  | { kind: 'message'; message: Message }
  | { kind: 'typing'; conversationId: string; typing: boolean }
  | { kind: 'conversation'; conversation: Conversation };

export type LedgerEntry = { id: string; label: string; delta: number; at: string };
export interface WalletService {
  /** Private: only the owner can read it. */
  balance(): Promise<number>;
  ledger(): Promise<LedgerEntry[]>;
}

export type PaymentItem = { kind: 'tier'; tierId: Exclude<TierId, 0> } | { kind: 'coins'; packId: string };
export type PaymentStatus = 'pending' | 'awaiting_pin' | 'succeeded' | 'failed' | 'cancelled';
export type Payment = {
  id: string;
  item: PaymentItem;
  operator: Operator['id'];
  msisdn: string;
  amount: number;
  currency: string;
  promoId?: string;
  status: PaymentStatus;
  providerRef?: string;
};
export interface PaymentService {
  /** Starts a Mobile Money collection. The user confirms with their PIN on the phone. */
  initiate(input: { item: PaymentItem; operator: Operator['id']; msisdn: string; promoId?: string }): Promise<Payment>;
  /** Status changes come from the operator callback, relayed by the backend. */
  watch(paymentId: string, listener: (p: Payment) => void): () => void;
  /** Mock only: simulates the user typing the PIN or cancelling on the USSD prompt. */
  simulateUserAction?(paymentId: string, action: 'confirm' | 'cancel'): void;
}

export interface SubscriptionService {
  current(): Promise<{ tier: TierId; renewsAt?: string }>;
}

export type PromoTarget = { kind: 'tier'; tierId: Exclude<TierId, 0> } | { kind: 'coins'; packId: string } | { kind: 'all-coins' };
export type Promo = {
  id: string;
  title: string;
  percentOff: number;
  target: PromoTarget;
  markets: MarketId[];
  /** Real start and end set by an admin. Countdowns read `endsAt` and never reset. */
  startsAt: string;
  endsAt: string;
  createdBy: string;
  active: boolean;
};
export interface PromoService {
  listActive(market: MarketId): Promise<Promo[]>;
  /** Admin only */
  listAll(): Promise<Promo[]>;
  create(input: Omit<Promo, 'id' | 'createdBy' | 'active'>): Promise<Promo>;
  end(promoId: string): Promise<void>;
}

export type ReportReason = 'fake' | 'inappropriate' | 'harassment' | 'minor' | 'scam' | 'other';
export interface ModerationService {
  report(profileId: string, reason: ReportReason, note?: string): Promise<void>;
  block(profileId: string): Promise<void>;
  /** Moderation hook: every uploaded photo goes through it before being shown. */
  reviewPhoto(photo: Photo): Promise<ModerationStatus>;
}

export type Services = {
  auth: AuthService;
  profile: ProfileService;
  discovery: DiscoveryService;
  chat: ChatService;
  wallet: WalletService;
  payments: PaymentService;
  subscription: SubscriptionService;
  promos: PromoService;
  moderation: ModerationService;
};
