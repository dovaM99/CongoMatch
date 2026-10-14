import { COIN_VALUE, MARKET, type MarketId } from '@/data/catalog';

export const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');

export const currencyOf = (m: MarketId) => MARKET[m].currency;
export const money = (m: MarketId, amount: number) => `${fmt(amount)} ${MARKET[m].currencyLabel}`;
export const priceIn = (m: MarketId, price: Record<string, number>) => price[MARKET[m].currency];
export const coinMoney = (m: MarketId, coins: number) => money(m, coins * COIN_VALUE[MARKET[m].currency]);

export const applyPercent = (amount: number, percentOff?: number) =>
  percentOff ? Math.round((amount * (100 - percentOff)) / 100) : amount;

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** h:mm:ss or "2 j 04:12:09" until the given date. */
export function remaining(endsAt: string, now = Date.now()) {
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const mi = Math.floor((s % 3600) / 60);
  const se = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { ms, label: `${d ? `${d} j ` : ''}${pad(h)}:${pad(mi)}:${pad(se)}` };
}
