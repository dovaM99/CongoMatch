import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Coins } from '@/components/media';
import { PromoBanner } from '@/components/overlays';
import { Shine } from '@/components/Shine';
import { SwipeCard, type SwipeCardHandle, type SwipeDir } from '@/components/SwipeCard';
import { Button, IconButton, Press, Row, Txt } from '@/components/ui';
import { UpsellSheet, type UpsellReason } from '@/components/Upsell';
import { Rules } from '@/lib/rules';
import type { Profile } from '@/services/types';
import { useApp, useServices } from '@/store/app';
import { Base, Fonts } from '@/theme/tokens';

export default function Discover() {
  const svc = useServices();
  const app = useApp();
  const { me, tier, prefs, theme, coins, promos, likesLeft, market } = app;
  const insets = useSafeAreaInsets();
  const [deck, setDeck] = useState<Profile[] | null>(null);
  const [last, setLast] = useState<Profile | null>(null);
  const [match, setMatch] = useState<{ peer: Profile; conversationId: string } | null>(null);
  const [upsell, setUpsell] = useState<UpsellReason | null>(null);
  const top = useRef<SwipeCardHandle>(null);
  const viaButton = useRef(false);
  const [resets, setResets] = useState(0);

  const load = useCallback(async () => {
    if (!me) return;
    setDeck(await svc.discovery.getDeck(prefs, me));
  }, [svc, prefs, me]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onSwiped(p: Profile, dir: SwipeDir) {
    const counted = viaButton.current;
    viaButton.current = false;
    if (dir === 'right' && !counted && !app.consumeLike()) {
      // out of free likes: put the card back
      setResets((n) => n + 1);
      setUpsell('likes');
      return;
    }
    setDeck((d) => (d ? d.filter((x) => x.id !== p.id) : d));
    setLast(p);
    if (dir === 'left') {
      await svc.discovery.pass(p.id);
      return;
    }
    const r = await svc.discovery.like(p.id);
    if (r.matched && r.conversationId) setMatch({ peer: p, conversationId: r.conversationId });
  }

  function act(dir: SwipeDir) {
    if (dir === 'right' && !app.consumeLike()) {
      setUpsell('likes');
      return;
    }
    viaButton.current = true;
    top.current?.swipe(dir);
  }

  function rewind() {
    if (!Rules.canRewind(tier)) return setUpsell('rewind');
    if (!last) return app.showToast('Rien à annuler pour le moment');
    setDeck((d) => [last, ...(d ?? [])]);
    setLast(null);
  }

  const promo = promos[0];
  const visible = (deck ?? []).slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: Base.bg }}>
      <LinearGradient colors={theme.wash} style={[StyleSheet.absoluteFill, { height: 300 }]} />
      <View style={[s.top, { paddingTop: insets.top + 6 }]}>
        <Image source={require('@/assets/images/logo.png')} style={{ width: 150, height: 55 }} contentFit="contain" />
        <View style={{ flex: 1 }} />
        <Press onPress={() => router.push('/wallet')} style={s.coins} accessibilityLabel="Mes pièces">
          <Coins n={coins} size={14} />
        </Press>
        <IconButton name="options" label="Filtres" onPress={() => router.push('/filters')} />
      </View>

      {promo && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <PromoBanner promo={promo} compact onPress={() => router.push('/plans')} />
        </View>
      )}

      <View style={s.deck}>
        {deck === null ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 120 }} />
        ) : visible.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 46 }}>🌊</Text>
            <Txt v="h2" center>Vous avez tout vu pour l'instant</Txt>
            <Txt v="small" center>Élargissez vos filtres ou revenez plus tard, de nouveaux profils arrivent chaque jour.</Txt>
            <Button title="Modifier mes filtres" icon="options" onPress={() => router.push('/filters')} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : (
          visible
            .map((p, i) => (
              <View key={`${p.id}-${resets}`} style={[StyleSheet.absoluteFill, i === 1 && { transform: [{ scale: 0.95 }, { translateY: 14 }], opacity: 0.7 }]}>
                <SwipeCard
                  ref={i === 0 ? top : undefined}
                  profile={p}
                  active={i === 0}
                  viewerTier={tier}
                  viewerMarket={market}
                  onSwiped={(dir) => onSwiped(p, dir)}
                  onInfo={() => router.push({ pathname: '/profile/[id]', params: { id: p.id } })}
                  onUpsell={setUpsell}
                />
              </View>
            ))
            .reverse()
        )}
      </View>

      {!!visible.length && (
        <View style={[s.actions, { marginBottom: insets.bottom + 92 }]}>
          <Round icon="refresh" color={Base.warn} size={48} onPress={rewind} label="Revenir" />
          <Round icon="close" color={Base.danger} size={62} onPress={() => act('left')} label="Passer" />
          <Round icon="heart" color="#fff" size={74} onPress={() => act('right')} label="Liker" grad={theme.grad} />
          <Round icon="information" color={Base.verified} size={48} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: visible[0].id } })} label="Voir le profil" />
        </View>
      )}
      {!!visible.length && tier === 0 && (
        <Text style={[s.counter, { bottom: insets.bottom + 76 }]}>{likesLeft} likes restants aujourd'hui</Text>
      )}

      <UpsellSheet reason={upsell} onClose={() => setUpsell(null)} />

      <Modal visible={!!match} transparent animationType="fade" onRequestClose={() => setMatch(null)}>
        {match && me && (
          <View style={s.match}>
            <LinearGradient colors={['rgba(194,24,91,0.95)', 'rgba(13,10,14,0.98)']} style={StyleSheet.absoluteFill} />
            <Text style={s.matchT}>C'est un match !</Text>
            <View style={{ flexDirection: 'row' }}>
              <Avatar profile={me} size={120} ring="#fff" />
              <View style={{ marginLeft: -24 }}>
                <Avatar profile={match.peer} size={120} ring="#fff" />
              </View>
            </View>
            <Txt center color="rgba(255,255,255,0.9)">Vous et {match.peer.firstName} vous êtes likés mutuellement.</Txt>
            <View style={{ alignSelf: 'stretch', gap: 10 }}>
              <Button
                title="Envoyer un message"
                icon="chatbubble"
                grad={['#FFFFFF', '#FFE1EA']}
                ink="#C2185B"
                onPress={() => {
                  const id = match.conversationId;
                  setMatch(null);
                  router.push({ pathname: '/chat/[id]', params: { id } });
                }}
              />
              <Button title="Offrir un cadeau 🎁" variant="glass" onPress={() => {
                const id = match.conversationId;
                setMatch(null);
                router.push({ pathname: '/chat/[id]', params: { id, gifts: '1' } });
              }} />
              <Button title="Continuer à découvrir" variant="ghost" onPress={() => setMatch(null)} shine={false} />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

function Round({ icon, color, size, onPress, label, grad }: { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; size: number; onPress: () => void; label: string; grad?: readonly [string, string, ...string[]] }) {
  return (
    <Press onPress={onPress} accessibilityLabel={label} scaleTo={0.85} style={[s.round, { width: size, height: size, borderRadius: size / 2 }]}>
      {grad ? <LinearGradient colors={grad} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: Base.surface }]} />}
      <Shine color={grad ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} every={3800} />
      <Ionicons name={icon} size={size * 0.46} color={color} />
    </Press>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 6 },
  coins: { paddingHorizontal: 12, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  deck: { flex: 1, marginHorizontal: 12, marginBottom: 14, maxWidth: 520, width: '100%', alignSelf: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  round: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: Base.line, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  counter: { position: 'absolute', alignSelf: 'center', fontFamily: Fonts.bodySemi, fontSize: 12, color: Base.ink3 },
  match: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 28 },
  matchT: { fontFamily: Fonts.display, fontSize: 36, color: '#fff', textAlign: 'center', letterSpacing: -1 },
});
