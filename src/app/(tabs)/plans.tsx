import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Countdown, PromoBanner } from '@/components/overlays';
import { Shine } from '@/components/Shine';
import { Button, Row, Screen, Txt } from '@/components/ui';
import { MARKET, TIERS } from '@/data/catalog';
import { applyPercent, money, priceIn } from '@/lib/format';
import { promoFor, useApp } from '@/store/app';
import { Base, Fonts, TierThemes } from '@/theme/tokens';

export default function Plans() {
  const { tier, market, promos, previewTier, setPreviewTier } = useApp();
  const insets = useSafeAreaInsets();
  const tierPromos = promos.filter((p) => p.target.kind === 'tier');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 6, gap: 4 }}>
        <Txt v="h1">Forfaits</Txt>
        <Txt v="small">Les forfaits de {MARKET[market].city}, payables par Mobile Money.</Txt>
      </View>
      {previewTier !== null && (
        <View style={s.preview}>
          <Text style={s.previewT}>Aperçu du thème {TierThemes[previewTier].name}</Text>
          <Button size="sm" title="Quitter" variant="glass" shine={false} onPress={() => setPreviewTier(null)} style={{ alignSelf: 'auto' }} />
        </View>
      )}
      <Screen>
        {tierPromos.map((p) => (
          <PromoBanner key={p.id} promo={p} />
        ))}
        {TIERS.map((t) => {
          const th = TierThemes[t.id];
          const isCur = tier === t.id;
          const lower = tier > t.id;
          const promo = promoFor(promos, { kind: 'tier', tierId: t.id });
          const base = priceIn(market, t.price);
          return (
            <View key={t.id} style={[s.card, { borderColor: isCur ? th.accent : Base.line, shadowColor: th.glow }]}>
              <LinearGradient colors={th.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.head}>
                <Shine color="rgba(255,255,255,0.35)" delay={t.id * 400} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={s.nameRow}>
                    <Text style={[s.crest, { color: th.accentInk }]}>{th.crest}</Text>
                    <Text style={[s.name, { color: th.accentInk }]} numberOfLines={1}>{t.name}</Text>
                  </View>
                  <View style={[s.local, { borderColor: th.accentInk }]}>
                    <Text style={[s.localT, { color: th.accentInk }]}>{t.local[market]}</Text>
                  </View>
                  {isCur && <Text style={[s.cur, { color: th.accentInk }]}>Votre forfait actuel</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {promo && <Text style={[s.old, { color: th.accentInk }]}>{money(market, base)}</Text>}
                  <Text style={[s.price, { color: th.accentInk }]}>{money(market, applyPercent(base, promo?.percentOff))}</Text>
                  <Text style={[s.per, { color: th.accentInk }]}>par mois</Text>
                </View>
              </LinearGradient>
              <View style={{ padding: 16, gap: 10 }}>
                {promo && !isCur && (
                  <Row style={s.promoRow}>
                    <Text style={s.promoT}>-{promo.percentOff}% · se termine dans</Text>
                    <Countdown endsAt={promo.endsAt} color={Base.rose} />
                  </Row>
                )}
                {t.perks.map((p) => (
                  <Row key={p} gap={10}>
                    <Ionicons name="checkmark-circle" size={18} color={th.accent} />
                    <Txt style={{ flex: 1 }}>{p}</Txt>
                  </Row>
                ))}
                {!isCur && (
                  <Row style={{ marginTop: 6 }}>
                    <Button size="sm" variant="ghost" title="Aperçu" icon="eye-outline" shine={false} onPress={() => setPreviewTier(t.id)} style={{ flex: 1 }} />
                    <Button
                      size="sm"
                      title={lower ? 'Inclus' : `Choisir ${t.name}`}
                      disabled={lower}
                      grad={th.grad}
                      ink={th.accentInk}
                      onPress={() => router.push({ pathname: '/checkout', params: { kind: 'tier', id: String(t.id) } })}
                      style={{ flex: 1.2 }}
                    />
                  </Row>
                )}
              </View>
            </View>
          );
        })}
        <Txt v="tiny" center>Paiement par MTN MoMo, Airtel Money, Orange Money ou M-Pesa selon votre pays. Sans engagement, renouvellement manuel.</Txt>
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1.5, backgroundColor: Base.surface, overflow: 'hidden', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, overflow: 'hidden' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  crest: { fontSize: 16, lineHeight: 24 },
  name: { fontFamily: Fonts.display, fontSize: 18, lineHeight: 24, flexShrink: 1 },
  local: { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2, opacity: 0.85 },
  localT: { fontFamily: Fonts.bodyBold, fontSize: 12.5, lineHeight: 17, letterSpacing: 0.3 },
  cur: { fontFamily: Fonts.bodySemi, fontSize: 12, opacity: 0.85 },
  old: { fontFamily: Fonts.bodySemi, fontSize: 12.5, textDecorationLine: 'line-through', opacity: 0.7 },
  price: { fontFamily: Fonts.display, fontSize: 16 },
  per: { fontFamily: Fonts.body, fontSize: 12, opacity: 0.75 },
  promoRow: { justifyContent: 'space-between', padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,61,110,0.12)' },
  promoT: { fontFamily: Fonts.bodyBold, fontSize: 13.5, color: Base.rose },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, padding: 10, borderRadius: 14, backgroundColor: Base.surface2 },
  previewT: { flex: 1, fontFamily: Fonts.bodySemi, color: Base.ink },
});
