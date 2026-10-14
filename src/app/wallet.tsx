import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Coin, Coins } from '@/components/media';
import { PromoBanner } from '@/components/overlays';
import { Shine } from '@/components/Shine';
import { Header, Press, Row, Screen, Txt } from '@/components/ui';
import { PACKS } from '@/data/catalog';
import { applyPercent, coinMoney, fmt, money, priceIn } from '@/lib/format';
import type { LedgerEntry } from '@/services/types';
import { promoFor, useApp, useServices } from '@/store/app';
import { Base, Fonts, Radius } from '@/theme/tokens';

export default function Wallet() {
  const svc = useServices();
  const { coins, market, promos, refreshWallet } = useApp();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  useFocusEffect(
    useCallback(() => {
      void refreshWallet();
      void svc.wallet.ledger().then(setLedger);
    }, [svc, refreshWallet]),
  );
  const coinPromos = promos.filter((p) => p.target.kind !== 'tier');

  return (
    <View style={{ flex: 1 }}>
      <Header title="Mes Pièces" />
      <Screen bottomInset={false}>
        <View style={s.card}>
          <LinearGradient colors={['#3B2A0C', '#7A5410', '#C8901F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Shine color="rgba(255,240,200,0.35)" />
          <Text style={s.priv}>🔒 Visible uniquement par vous</Text>
          <Txt v="label" color="rgba(255,255,255,0.8)">Solde</Txt>
          <Row gap={10}>
            <Coin size={34} />
            <Text style={s.bal}>{fmt(coins)}</Text>
          </Row>
          <Txt v="small" color="rgba(255,255,255,0.85)">≈ {coinMoney(market, coins)} · 1 pièce = {coinMoney(market, 1)}</Txt>
        </View>

        {coinPromos.map((p) => (
          <PromoBanner key={p.id} promo={p} />
        ))}

        <Txt v="label">Recharger par Mobile Money</Txt>
        <View style={s.packs}>
          {PACKS.map((k) => {
            const promo = promoFor(promos, { kind: 'coins', packId: k.id });
            const base = priceIn(market, k.price);
            return (
              <Press key={k.id} onPress={() => router.push({ pathname: '/checkout', params: { kind: 'coins', id: k.id } })} style={s.pack}>
                <Shine color="rgba(255,255,255,0.08)" every={5000} />
                {(k.tag || promo) && (
                  <View style={[s.tag, promo && { backgroundColor: Base.rose }]}>
                    <Text style={s.tagT}>{promo ? `-${promo.percentOff}%` : k.tag}</Text>
                  </View>
                )}
                <Coins n={k.coins + (k.bonus ?? 0)} size={18} />
                {k.bonus ? <Txt v="tiny">dont {k.bonus} offertes</Txt> : <Txt v="tiny"> </Txt>}
                {promo && <Text style={s.old}>{money(market, base)}</Text>}
                <Text style={s.price}>{money(market, applyPercent(base, promo?.percentOff))}</Text>
              </Press>
            );
          })}
        </View>

        <Txt v="label">Historique</Txt>
        <View style={s.ledger}>
          {ledger.length === 0 && <Txt v="small">Aucune opération pour le moment.</Txt>}
          {ledger.map((l) => (
            <Row key={l.id} style={s.lrow}>
              <View style={{ flex: 1 }}>
                <Txt>{l.label}</Txt>
                <Txt v="tiny">{new Date(l.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</Txt>
              </View>
              <Text style={[s.delta, { color: l.delta > 0 ? Base.ok : Base.ink2 }]}>
                {l.delta > 0 ? '+' : ''}
                {fmt(l.delta)}
              </Text>
            </Row>
          ))}
        </View>
        <Txt v="tiny" center>Les pièces servent à offrir des cadeaux dans les conversations. Personne d'autre ne voit votre solde.</Txt>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 26, padding: 22, gap: 8, overflow: 'hidden' },
  priv: { alignSelf: 'flex-end', fontFamily: Fonts.bodyBold, fontSize: 11.5, color: '#fff', backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  bal: { fontFamily: Fonts.display, fontSize: 40, color: '#fff' },
  packs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pack: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: 18, paddingHorizontal: 8, borderRadius: Radius.lg, backgroundColor: Base.surface, borderWidth: 1, borderColor: Base.line, overflow: 'hidden' },
  tag: { position: 'absolute', top: 0, right: 0, backgroundColor: '#C8901F', paddingHorizontal: 8, paddingVertical: 3, borderBottomLeftRadius: 10 },
  tagT: { fontFamily: Fonts.bodyBold, fontSize: 10.5, color: '#fff' },
  old: { fontFamily: Fonts.body, fontSize: 12, color: Base.ink3, textDecorationLine: 'line-through' },
  price: { fontFamily: Fonts.bodyBold, fontSize: 14.5, color: Base.ink },
  ledger: { borderRadius: Radius.lg, backgroundColor: Base.surface, borderWidth: 1, borderColor: Base.line, paddingHorizontal: 14 },
  lrow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Base.line },
  delta: { fontFamily: Fonts.bodyBold, fontSize: 16 },
});
