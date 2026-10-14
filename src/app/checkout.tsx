import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Countdown } from '@/components/overlays';
import { Button, Field, Press, Row, Txt } from '@/components/ui';
import { COUNTRIES, OPERATORS, PACKS, TIERS, type Operator } from '@/data/catalog';
import { applyPercent, money, priceIn } from '@/lib/format';
import type { Payment } from '@/services/types';
import { promoFor, useApp, useServices } from '@/store/app';
import { Base, Fonts, Radius, TierThemes } from '@/theme/tokens';

/** Mobile Money checkout: choose operator, push request, PIN on the phone, operator callback. */
export default function Checkout() {
  const { kind, id } = useLocalSearchParams<{ kind: 'tier' | 'coins'; id: string }>();
  const svc = useServices();
  const app = useApp();
  const { market, promos } = app;
  const insets = useSafeAreaInsets();
  const ops = OPERATORS[market];
  const [op, setOp] = useState<Operator['id']>(ops[0].id);
  const [msisdn, setMsisdn] = useState('');
  const [pay, setPay] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);

  const tier = kind === 'tier' ? TIERS.find((t) => t.id === Number(id)) : undefined;
  const pack = kind === 'coins' ? PACKS.find((p) => p.id === id) : undefined;
  const item = tier ? ({ kind: 'tier', tierId: tier.id } as const) : ({ kind: 'coins', packId: pack?.id ?? '' } as const);
  const promo = promoFor(promos, item);
  const base = priceIn(market, (tier ?? pack)?.price ?? { XAF: 0, CDF: 0 });
  const amount = applyPercent(base, promo?.percentOff);
  const label = tier ? `Forfait ${tier.name} · ${tier.local[market]} · 1 mois` : `${(pack?.coins ?? 0) + (pack?.bonus ?? 0)} pièces`;
  const operator = ops.find((o) => o.id === op)!;
  const dial = COUNTRIES.find((c) => c.code === market)!.dial;

  useEffect(() => {
    if (!pay) return;
    return svc.payments.watch(pay.id, (p) => {
      setPay(p);
      if (p.status === 'succeeded') void Promise.all([app.refreshTier(), app.refreshWallet()]);
    });
  }, [svc, pay?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    if (msisdn.replace(/\D/g, '').length < 8) return app.showToast('Entrez votre numéro Mobile Money');
    setBusy(true);
    try {
      setPay(await svc.payments.initiate({ item, operator: op, msisdn: `${dial}${msisdn.replace(/\D/g, '')}`, promoId: promo?.id }));
    } catch (e) {
      app.showToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace('/plans'));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={StyleSheet.absoluteFill} onPress={pay ? undefined : close}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      </Pressable>
      <View style={[s.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={s.grab} />
        {!pay && (
          <>
            <Txt v="h2">Paiement Mobile Money</Txt>
            <View style={s.summary}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt style={{ flex: 1 }}>{label}</Txt>
                <View style={{ alignItems: 'flex-end' }}>
                  {promo && <Text style={s.old}>{money(market, base)}</Text>}
                  <Text style={s.amount}>{money(market, amount)}</Text>
                </View>
              </Row>
              {promo && (
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt v="small" color={Base.rose}>Promo -{promo.percentOff}% · fin dans</Txt>
                  <Countdown endsAt={promo.endsAt} color={Base.rose} />
                </Row>
              )}
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt v="small">Frais opérateur</Txt>
                <Txt v="small">0</Txt>
              </Row>
            </View>
            <Txt v="label">Opérateur</Txt>
            <View style={{ gap: 8 }}>
              {ops.map((o) => (
                <Press key={o.id} onPress={() => setOp(o.id)} style={[s.op, op === o.id && { borderColor: app.theme.accent }]} scaleTo={0.98}>
                  <View style={[s.logo, { backgroundColor: o.bg }]}>
                    <Text style={[s.logoT, { color: o.fg }]}>{o.abbr}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt v="h3">{o.name}</Txt>
                    <Txt v="tiny">{o.ussd}</Txt>
                  </View>
                  <Ionicons name={op === o.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={op === o.id ? app.theme.accent : Base.ink3} />
                </Press>
              ))}
            </View>
            <Field label={`Numéro ${operator.name}`} prefix={dial} keyboardType="phone-pad" value={msisdn} onChangeText={setMsisdn} placeholder={COUNTRIES.find((c) => c.code === market)?.placeholder} />
            <Button title={`Payer ${money(market, amount)}`} icon="lock-closed" onPress={start} loading={busy} />
            <Txt v="tiny" center>Vous recevrez une demande de confirmation sur votre téléphone. Ne partagez jamais votre code PIN.</Txt>
          </>
        )}

        {pay?.status === 'pending' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={app.theme.accent} />
            <Txt v="h3" center>Connexion à {operator.name}…</Txt>
          </View>
        )}

        {pay?.status === 'awaiting_pin' && (
          <View style={{ gap: 14 }}>
            <Txt v="h3" center>Regardez votre téléphone</Txt>
            <Txt v="small" center>Une demande {operator.name} est arrivée. Entrez votre code PIN pour confirmer.</Txt>
            {svc.payments.simulateUserAction && (
              <View style={s.ussd}>
                <Text style={s.ussdT}>
                  {operator.name}
                  {'\n'}Vous allez payer {money(market, pay.amount)} à CONGOMATCH.{'\n'}Réf : {pay.id.slice(-8).toUpperCase()}
                  {'\n'}Entrez votre code PIN :
                </Text>
                <Txt v="tiny" color="#aaa">Mode démo : aucun vrai paiement.</Txt>
                <Row style={{ justifyContent: 'flex-end', gap: 22 }}>
                  <Pressable onPress={() => svc.payments.simulateUserAction!(pay.id, 'cancel')}>
                    <Text style={s.ussdB}>Annuler</Text>
                  </Pressable>
                  <Pressable onPress={() => svc.payments.simulateUserAction!(pay.id, 'confirm')}>
                    <Text style={s.ussdB}>Envoyer</Text>
                  </Pressable>
                </Row>
              </View>
            )}
          </View>
        )}

        {pay?.status === 'succeeded' && (
          <View style={s.center}>
            <Animated.Text entering={ZoomIn.springify()} style={{ fontSize: 64 }}>
              {tier ? TierThemes[tier.id].crest : '🪙'}
            </Animated.Text>
            <Txt v="h1" center>Paiement confirmé</Txt>
            <Txt v="small" center>{tier ? `Bienvenue en ${tier.name} · ${tier.local[market]}. Votre thème ${tier.theme} est activé.` : `${label} ajoutées à votre solde.`}</Txt>
            <Txt v="tiny">Transaction {pay.providerRef}</Txt>
            <Button title={tier ? 'Découvrir mon nouveau thème' : 'Retour'} onPress={close} />
          </View>
        )}

        {(pay?.status === 'cancelled' || pay?.status === 'failed') && (
          <View style={s.center}>
            <Text style={{ fontSize: 44 }}>✕</Text>
            <Txt v="h2" center>Paiement {pay.status === 'cancelled' ? 'annulé' : 'échoué'}</Txt>
            <Txt v="small" center>Aucun montant n'a été débité.</Txt>
            <Button title="Réessayer" onPress={() => setPay(null)} />
            <Button title="Fermer" variant="ghost" onPress={close} shine={false} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Base.bg2, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 12, gap: 14, borderWidth: 1, borderColor: Base.line, maxWidth: 560, width: '100%', alignSelf: 'center' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Base.lineStrong },
  summary: { padding: 14, borderRadius: Radius.md, backgroundColor: Base.surface, gap: 8 },
  old: { fontFamily: Fonts.body, fontSize: 12.5, color: Base.ink3, textDecorationLine: 'line-through' },
  amount: { fontFamily: Fonts.display, fontSize: 17, color: Base.ink },
  op: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Base.line, backgroundColor: Base.surface },
  logo: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoT: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  ussd: { backgroundColor: '#2B2B2E', borderRadius: 14, padding: 18, gap: 12 },
  ussdT: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 14, lineHeight: 21, color: '#F2F2F2' },
  ussdB: { fontFamily: Fonts.bodyBold, fontSize: 15, color: '#6AB0F5' },
});
