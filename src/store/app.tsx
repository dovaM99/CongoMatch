import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { MarketId, TierId } from '@/data/catalog';
import { Rules } from '@/lib/rules';
import { getServices, type Preferences, type Profile, type Promo, type Session } from '@/services';
import { TierThemes, type TierTheme } from '@/theme/tokens';

const PREFS_KEY = 'congomatch.prefs.v1';
const LIKES_KEY = 'congomatch.likes.v1';

export const defaultPrefs = (gender?: 'h' | 'f'): Preferences => ({
  seek: gender === 'f' ? 'h' : 'f',
  ageMin: 21,
  ageMax: 35,
  intentions: [],
  languages: [],
  verifiedOnly: false,
});

type Toast = { id: number; text: string; tone?: 'ok' | 'info' | 'warn' };

type AppState = {
  booted: boolean;
  session: Session | null;
  me: Profile | null;
  tier: TierId;
  previewTier: TierId | null;
  coins: number;
  prefs: Preferences;
  promos: Promo[];
  likesLeft: number;
  toast: Toast | null;
  /** onboarding in progress (phone verified, profile incomplete) */
  onboarded: boolean;
  market: MarketId;
  theme: TierTheme;
};

type AppActions = {
  setSession(s: Session): Promise<void>;
  saveProfile(patch: Partial<Profile>): Promise<Profile>;
  reloadMe(): Promise<void>;
  setPrefs(p: Preferences): void;
  refreshWallet(): Promise<void>;
  refreshTier(): Promise<void>;
  refreshPromos(): Promise<void>;
  consumeLike(): boolean;
  setPreviewTier(t: TierId | null): void;
  showToast(text: string, tone?: Toast['tone']): void;
  signOut(): Promise<void>;
};

const Ctx = createContext<(AppState & AppActions) | null>(null);

export const isProfileComplete = (p: Profile | null) =>
  !!p && !!p.firstName && !!p.birthDate && p.photos.filter((x) => x.kind !== 'private').length >= 2;

export function AppProvider({ children }: { children: ReactNode }) {
  const svc = getServices();
  const [booted, setBooted] = useState(false);
  const [session, setSessionState] = useState<Session | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [tier, setTier] = useState<TierId>(0);
  const [previewTier, setPreviewTier] = useState<TierId | null>(null);
  const [coins, setCoins] = useState(0);
  const [prefs, setPrefsState] = useState<Preferences>(defaultPrefs());
  const [promos, setPromos] = useState<Promo[]>([]);
  const [likes, setLikes] = useState({ day: new Date().toDateString(), used: 0 });
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const market: MarketId = me?.market ?? 'CG';

  const refreshWallet = useCallback(async () => setCoins(await svc.wallet.balance()), [svc]);
  const refreshTier = useCallback(async () => {
    const t = (await svc.subscription.current()).tier;
    setTier(t);
    setMe((m) => (m ? { ...m, tier: t } : m));
  }, [svc]);
  const refreshPromos = useCallback(async () => setPromos(await svc.promos.listActive(market)), [svc, market]);
  const reloadMe = useCallback(async () => setMe(await svc.profile.getMe()), [svc]);

  useEffect(() => {
    (async () => {
      try {
        const [rawPrefs, rawLikes, m, sub, bal] = await Promise.all([
          AsyncStorage.getItem(PREFS_KEY),
          AsyncStorage.getItem(LIKES_KEY),
          svc.profile.getMe(),
          svc.subscription.current(),
          svc.wallet.balance(),
        ]);
        if (rawPrefs) setPrefsState(JSON.parse(rawPrefs));
        if (rawLikes) {
          const l = JSON.parse(rawLikes);
          if (l.day === new Date().toDateString()) setLikes(l);
        }
        setMe(m);
        setTier(sub.tier);
        setCoins(bal);
        if (m) setSessionState({ userId: m.id, token: 'restored', isNew: false, isAdmin: false });
      } finally {
        setBooted(true);
      }
    })();
  }, [svc]);

  useEffect(() => {
    if (booted) void refreshPromos();
  }, [booted, refreshPromos]);

  // Photos are moderated after upload: refresh while any is pending.
  useEffect(() => {
    if (!me?.photos.some((p) => p.moderation === 'pending')) return;
    const t = setInterval(reloadMe, 2000);
    return () => clearInterval(t);
  }, [me, reloadMe]);

  const actions: AppActions = useMemo(
    () => ({
      async setSession(s) {
        setSessionState(s);
        await Promise.all([reloadMe(), refreshWallet(), refreshTier()]);
      },
      async saveProfile(patch) {
        const p = await svc.profile.saveMe(patch);
        setMe(p);
        return p;
      },
      reloadMe,
      setPrefs(p) {
        setPrefsState(p);
        AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p)).catch(() => {});
      },
      refreshWallet,
      refreshTier,
      refreshPromos,
      consumeLike() {
        if (Rules.canRewind(tier)) return true; // Plus and above: unlimited likes
        const today = new Date().toDateString();
        const used = likes.day === today ? likes.used : 0;
        if (used >= Rules.dailyFreeLikes) return false;
        const next = { day: today, used: used + 1 };
        setLikes(next);
        AsyncStorage.setItem(LIKES_KEY, JSON.stringify(next)).catch(() => {});
        return true;
      },
      setPreviewTier,
      showToast(text, tone = 'info') {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ id: Date.now(), text, tone });
        toastTimer.current = setTimeout(() => setToast(null), 2800);
      },
      async signOut() {
        await svc.auth.signOut();
        await AsyncStorage.multiRemove([PREFS_KEY, LIKES_KEY]);
        setSessionState(null);
        setMe(null);
        setTier(0);
        setCoins(0);
        setPrefsState(defaultPrefs());
        setLikes({ day: new Date().toDateString(), used: 0 });
      },
    }),
    [svc, reloadMe, refreshWallet, refreshTier, refreshPromos, tier, likes],
  );

  const value = {
    booted,
    session,
    me,
    tier,
    previewTier,
    coins,
    prefs,
    promos,
    likesLeft: Math.max(0, Rules.dailyFreeLikes - (likes.day === new Date().toDateString() ? likes.used : 0)),
    toast,
    onboarded: isProfileComplete(me),
    market,
    theme: TierThemes[previewTier ?? tier],
    ...actions,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

export const useServices = () => getServices();

/** Best live promo for an item, if an admin started one. */
export function promoFor(promos: Promo[], item: { kind: 'tier'; tierId: number } | { kind: 'coins'; packId: string }) {
  const now = Date.now();
  return promos
    .filter((p) => new Date(p.endsAt).getTime() > now && new Date(p.startsAt).getTime() <= now)
    .filter((p) =>
      item.kind === 'tier'
        ? p.target.kind === 'tier' && p.target.tierId === item.tierId
        : p.target.kind === 'all-coins' || (p.target.kind === 'coins' && p.target.packId === item.packId),
    )
    .sort((a, b) => b.percentOff - a.percentOff)[0];
}
