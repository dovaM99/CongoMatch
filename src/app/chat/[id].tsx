import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Coins, TeamBadge, TierBadge } from '@/components/media';
import { Sheet } from '@/components/overlays';
import { Button, Chip, Chips, IconButton, Press, Row, Txt } from '@/components/ui';
import { UpsellSheet } from '@/components/Upsell';
import { GIFT_CATEGORIES, GIFTS, type GiftCategory } from '@/data/catalog';
import { coinMoney, time } from '@/lib/format';
import { Rules } from '@/lib/rules';
import type { Conversation, Message } from '@/services/types';
import { useApp, useServices } from '@/store/app';
import { Base, Fonts, Radius } from '@/theme/tokens';

export default function Chat() {
  const { id, gifts } = useLocalSearchParams<{ id: string; gifts?: string }>();
  const svc = useServices();
  const app = useApp();
  const { me, tier, theme, coins, market } = app;
  const insets = useSafeAreaInsets();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [giftOpen, setGiftOpen] = useState(gifts === '1');
  const [cat, setCat] = useState<GiftCategory>('petits');
  const [voiceAsk, setVoiceAsk] = useState(false);
  const [upsell, setUpsell] = useState(false);
  const [rec, setRec] = useState<number | null>(null);
  const [burst, setBurst] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [list, m] = await Promise.all([svc.chat.list(), svc.chat.messages(id)]);
      if (!alive) return;
      setConv(list.find((c) => c.id === id) ?? null);
      setMsgs(m);
      void svc.chat.markRead(id);
    };
    void load();
    const off = svc.chat.subscribe((e) => {
      if (e.kind === 'typing' && e.conversationId === id) setTyping(e.typing);
      if (e.kind === 'message' && e.message.conversationId === id) void load();
    });
    return () => {
      alive = false;
      off();
    };
  }, [svc, id]);

  useEffect(() => {
    if (rec === null) return;
    const t = setInterval(() => setRec((r) => (r === null ? r : r + 1)), 1000);
    return () => clearInterval(t);
  }, [rec]);

  if (!conv || !me) return <View style={{ flex: 1, backgroundColor: Base.bg }} />;
  const peer = conv.peer;
  const voiceOk = Rules.voiceAvailable(tier, peer, conv.voiceUnlocked);

  async function send() {
    const t = text.trim();
    if (!t) return;
    setText('');
    await svc.chat.sendText(id, t);
  }

  function mic() {
    if (peer.isTeam) return app.showToast('Le compte officiel ne reçoit pas de notes vocales');
    if (voiceOk) return setRec(0);
    if (Rules.canAskVoice(tier, peer)) return setVoiceAsk(true);
    setUpsell(true);
  }

  async function sendVoice() {
    const d = rec ?? 0;
    setRec(null);
    if (d < 1) return;
    // Production: record with expo-audio, upload the file, then send its URL.
    await svc.chat.sendVoice(id, d);
  }

  async function sendGift(giftId: string) {
    try {
      await svc.chat.sendGift(id, giftId);
      await app.refreshWallet();
      setGiftOpen(false);
      setBurst(GIFTS.find((g) => g.id === giftId)?.emoji ?? '🎁');
      setTimeout(() => setBurst(null), 1600);
    } catch (e) {
      if ((e as Error).message === 'INSUFFICIENT_COINS') {
        setGiftOpen(false);
        app.showToast('Solde insuffisant, rechargez vos pièces');
        router.push('/wallet');
      } else app.showToast((e as Error).message);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Base.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={theme.wash} style={[StyleSheet.absoluteFill, { height: 260 }]} />
      <View style={[s.head, { paddingTop: insets.top + 6 }]}>
        <IconButton name="chevron-back" label="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))} />
        <Press onPress={() => !peer.isTeam && router.push({ pathname: '/profile/[id]', params: { id: peer.id, matched: '1' } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }} haptic={false} scaleTo={0.98}>
          <Avatar profile={peer} size={42} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.peer} numberOfLines={1}>{peer.firstName}</Text>
            {peer.isTeam ? <Txt v="tiny" color={Base.rose}>Compte officiel</Txt> : <Txt v="tiny" color={typing ? theme.accent : Base.ink3}>{typing ? 'écrit…' : 'En ligne'}</Txt>}
          </View>
        </Press>
        {!peer.isTeam && <IconButton name="gift" label="Offrir un cadeau" onPress={() => setGiftOpen(true)} color={theme.accent} />}
      </View>

      <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} contentContainerStyle={{ padding: 16, gap: 8 }}>
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {peer.isTeam ? <TeamBadge /> : peer.tier > 0 ? <TierBadge tier={peer.tier} market={peer.market} size="sm" /> : null}
          {!peer.isTeam && <Txt v="tiny">Vous avez matché le {new Date(conv.createdAt).toLocaleDateString('fr-FR')}</Txt>}
        </View>
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} mine={m.from === me.id} peerName={peer.firstName} accent={theme.accent} accentInk={theme.accentInk} canAnswer={Rules.canSendVoice(tier)} onAnswer={(ok) => svc.chat.answerVoiceRequest(m.id, ok)} />
        ))}
        {typing && (
          <Animated.View entering={FadeIn} style={[s.b, s.them, { flexDirection: 'row', gap: 4 }]}>
            <Text style={{ color: Base.ink2 }}>•••</Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[s.composer, { paddingBottom: insets.bottom + 10 }]}>
        {rec !== null ? (
          <Row style={{ flex: 1 }}>
            <View style={s.recDot} />
            <Text style={[s.peer, { flex: 1 }]}>0:{String(rec).padStart(2, '0')}</Text>
            <IconButton name="close" label="Annuler" onPress={() => setRec(null)} />
            <IconButton name="send" label="Envoyer la note vocale" bg={theme.accent} color={theme.accentInk} onPress={sendVoice} />
          </Row>
        ) : (
          <>
            {!peer.isTeam && <IconButton name="gift-outline" label="Cadeau" onPress={() => setGiftOpen(true)} />}
            <TextInput value={text} onChangeText={setText} placeholder="Écrire un message…" placeholderTextColor={Base.ink3} style={s.input} onSubmitEditing={send} returnKeyType="send" />
            {text.trim() ? (
              <IconButton name="send" label="Envoyer" bg={theme.accent} color={theme.accentInk} onPress={send} />
            ) : (
              <IconButton name={voiceOk ? 'mic' : 'mic-outline'} label="Note vocale" onPress={mic} color={voiceOk ? theme.accent : Base.ink2} />
            )}
          </>
        )}
      </View>

      <Sheet visible={giftOpen} onClose={() => setGiftOpen(false)}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt v="h2">Offrir à {peer.firstName}</Txt>
          <Press onPress={() => router.push('/wallet')} style={s.bal}>
            <Coins n={coins} />
          </Press>
        </Row>
        <Chips>
          {GIFT_CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.name} selected={cat === c.id} onPress={() => setCat(c.id)} />
          ))}
        </Chips>
        {cat === 'petits' && <Txt v="small">Dès {coinMoney(market, 10)}, pour faire plaisir sans réfléchir.</Txt>}
        <View style={s.gifts}>
          {GIFTS.filter((g) => g.cat === cat).map((g) => (
            <Press key={g.id} onPress={() => sendGift(g.id)} style={[s.gift, coins < g.cost && { opacity: 0.55 }]}>
              <Text style={{ fontSize: 38 }}>{g.emoji}</Text>
              <Text style={s.giftN} numberOfLines={1}>{g.name}</Text>
              <Coins n={g.cost} size={13} />
              <Txt v="tiny">{coinMoney(market, g.cost)}</Txt>
            </Press>
          ))}
        </View>
        <Txt v="tiny" center>🔒 Votre solde reste privé. {peer.firstName} voit seulement le cadeau.</Txt>
        <Button title="Recharger mes pièces" variant="ghost" onPress={() => { setGiftOpen(false); router.push('/wallet'); }} />
      </Sheet>

      <Sheet visible={voiceAsk} onClose={() => setVoiceAsk(false)}>
        <Text style={{ fontSize: 40 }}>🎤</Text>
        <Txt v="h2">Demander les notes vocales</Txt>
        <Txt v="small">
          Votre forfait n'inclut pas les notes vocales, mais celui de {peer.firstName} oui. Envoyez-lui une demande : si {peer.firstName} accepte, vous pourrez tous les deux échanger des notes vocales dans cette conversation.
        </Txt>
        <Button
          title={`Demander à ${peer.firstName}`}
          icon="mic"
          onPress={async () => {
            setVoiceAsk(false);
            await svc.chat.requestVoice(id);
          }}
        />
        <Button title="Ou passer à Gold" variant="ghost" onPress={() => { setVoiceAsk(false); setUpsell(true); }} />
      </Sheet>
      <UpsellSheet reason={upsell ? 'voice' : null} onClose={() => setUpsell(false)} />

      {burst && (
        <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut} pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 160 }}>{burst}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

function Bubble({ m, mine, peerName, accent, accentInk, canAnswer, onAnswer }: { m: Message; mine: boolean; peerName: string; accent: string; accentInk: string; canAnswer: boolean; onAnswer: (ok: boolean) => void }) {
  if (m.type === 'system') return <Txt v="tiny" center style={{ marginVertical: 6 }}>{m.text}</Txt>;
  if (m.type === 'gift') {
    const g = GIFTS.find((x) => x.id === m.giftId);
    return (
      <Animated.View entering={FadeInUp} style={[s.giftB, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
        <Text style={{ fontSize: 56 }}>{g?.emoji}</Text>
        <Txt v="tiny">{mine ? 'Vous avez offert' : `${peerName} a offert`} : {g?.name}</Txt>
      </Animated.View>
    );
  }
  if (m.type === 'voice-request') {
    const stateLabel = m.state === 'pending' ? 'En attente' : m.state === 'accepted' ? 'Acceptée ✓' : 'Refusée';
    return (
      <View style={[s.req, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
        <Txt v="h3">🎤 {mine ? 'Vous avez demandé' : `${peerName} demande`} les notes vocales</Txt>
        <Txt v="small">{stateLabel}</Txt>
        {!mine && m.state === 'pending' && canAnswer && (
          <Row>
            <Button size="sm" title="Accepter" onPress={() => onAnswer(true)} style={{ flex: 1 }} />
            <Button size="sm" title="Refuser" variant="ghost" onPress={() => onAnswer(false)} style={{ flex: 1 }} shine={false} />
          </Row>
        )}
      </View>
    );
  }
  const tick = mine ? (m.status === 'read' ? '✓✓' : m.status === 'delivered' ? '✓✓' : '✓') : '';
  return (
    <Animated.View entering={FadeInUp.duration(220)} style={[s.b, mine ? [s.mine, { backgroundColor: accent }] : s.them]}>
      {m.type === 'text' ? (
        <Text style={[s.bt, mine && { color: accentInk }]}>{m.text}</Text>
      ) : (
        <Row gap={8}>
          <Ionicons name="play" size={18} color={mine ? accentInk : Base.ink} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 }}>
            {Array.from({ length: 22 }, (_, i) => (
              <View key={i} style={{ width: 3, borderRadius: 2, height: 6 + ((i * 7) % 16), backgroundColor: mine ? accentInk : Base.ink2, opacity: 0.8 }} />
            ))}
          </View>
          <Text style={[s.bt, { fontSize: 12 }, mine && { color: accentInk }]}>0:{String(m.durationSec).padStart(2, '0')}</Text>
        </Row>
      )}
      <Text style={[s.meta, mine && { color: accentInk, opacity: 0.7 }]}>
        {time(m.at)} {tick && <Text style={{ color: m.status === 'read' && !mine ? Base.verified : undefined }}>{tick}</Text>}
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Base.line },
  peer: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Base.ink },
  b: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, gap: 2 },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  them: { alignSelf: 'flex-start', backgroundColor: Base.surface2, borderBottomLeftRadius: 6 },
  bt: { fontFamily: Fonts.body, fontSize: 15.5, lineHeight: 21, color: Base.ink },
  meta: { fontFamily: Fonts.body, fontSize: 10.5, color: Base.ink3, alignSelf: 'flex-end' },
  giftB: { alignItems: 'center', gap: 4, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Base.line },
  req: { maxWidth: '86%', gap: 8, padding: 14, borderRadius: 18, backgroundColor: Base.surface, borderWidth: 1, borderColor: 'rgba(232,190,90,0.45)' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Base.line, backgroundColor: Base.bg2 },
  input: { flex: 1, minHeight: 42, borderRadius: 21, paddingHorizontal: 16, backgroundColor: Base.surface, color: Base.ink, fontFamily: Fonts.body, fontSize: 15.5 },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Base.danger, marginLeft: 8 },
  bal: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: Base.surface2 },
  gifts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gift: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Base.surface, borderWidth: 1, borderColor: Base.line },
  giftN: { fontFamily: Fonts.bodySemi, fontSize: 13, color: Base.ink },
});
