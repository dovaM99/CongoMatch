import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/media';
import { Shine } from '@/components/Shine';
import { Button, Press, Row, Screen, Txt } from '@/components/ui';
import { UpsellSheet } from '@/components/Upsell';
import { GIFTS } from '@/data/catalog';
import { time } from '@/lib/format';
import { Rules } from '@/lib/rules';
import type { Conversation, Message, Profile } from '@/services/types';
import { useApp, useServices } from '@/store/app';
import { Base, Fonts } from '@/theme/tokens';

const preview = (m?: Message) => {
  if (!m) return 'Dites bonjour 👋🏾';
  switch (m.type) {
    case 'text':
    case 'system':
      return m.text;
    case 'voice':
      return '🎤 Note vocale';
    case 'gift':
      return `🎁 ${GIFTS.find((g) => g.id === m.giftId)?.name ?? 'Cadeau'}`;
    case 'voice-request':
      return '🎤 Demande de notes vocales';
  }
};

export default function Messages() {
  const svc = useServices();
  const { tier, me, theme } = useApp();
  const insets = useSafeAreaInsets();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [likers, setLikers] = useState<Profile[]>([]);
  const [upsell, setUpsell] = useState(false);

  const load = useCallback(async () => {
    const [c, l] = await Promise.all([svc.chat.list(), svc.discovery.getLikers()]);
    setConvs(c);
    setLikers(l);
  }, [svc]);
  useFocusEffect(useCallback(() => void load(), [load]));
  useEffect(() => svc.chat.subscribe(() => void load()), [svc, load]);

  const fresh = convs.filter((c) => !c.lastMessage && !c.peer.isTeam);
  const active = convs.filter((c) => c.lastMessage || c.peer.isTeam);
  const seeLikers = Rules.canSeeLikers(tier);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 6 }}>
        <Txt v="h1">Messages</Txt>
      </View>
      <Screen padded={false}>
        {likers.length > 0 && (
          <Press onPress={() => (seeLikers ? undefined : setUpsell(true))} style={[s.likers, { borderColor: theme.accent }]} scaleTo={0.98}>
            <Shine color="rgba(255,255,255,0.1)" />
            <View style={{ flexDirection: 'row' }}>
              {likers.slice(0, 3).map((p, i) => (
                <View key={p.id} style={{ marginLeft: i ? -16 : 0 }}>
                  <Avatar profile={p} size={46} blur={!seeLikers} ring={Base.bg} />
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Txt v="h3">{likers.length} personne{likers.length > 1 ? 's' : ''} vous ont liké</Txt>
              <Txt v="small">{seeLikers ? 'Retrouvez-les dans Découvrir et likez en retour.' : 'Découvrez qui avec Gold.'}</Txt>
            </View>
            <Ionicons name={seeLikers ? 'chevron-forward' : 'lock-closed'} size={20} color={Base.ink2} />
          </Press>
        )}

        {fresh.length > 0 && (
          <View style={{ gap: 10 }}>
            <Txt v="label" style={{ paddingHorizontal: 20 }}>Nouveaux matchs</Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}>
              {fresh.map((c) => (
                <Press key={c.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} style={{ alignItems: 'center', gap: 6 }}>
                  <Avatar profile={c.peer} size={70} ring={theme.accent} />
                  <Text style={s.freshName}>{c.peer.firstName}</Text>
                </Press>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ gap: 2 }}>
          {active.length > 0 && <Txt v="label" style={{ paddingHorizontal: 20, marginBottom: 6 }}>Conversations</Txt>}
          {active.map((c) => (
            <Press key={c.id} scaleTo={0.98} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} style={s.row}>
              <Avatar profile={c.peer} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6}>
                  <Text style={s.name}>{c.peer.firstName}</Text>
                  {c.peer.isTeam && <Ionicons name="checkmark-circle" size={16} color={Base.rose} />}
                </Row>
                <Text numberOfLines={1} style={[s.prev, c.unread > 0 && { color: Base.ink, fontFamily: Fonts.bodySemi }]}>
                  {c.lastMessage?.from === me?.id ? 'Vous : ' : ''}
                  {preview(c.lastMessage)}
                </Text>
              </View>
              {c.unread > 0 ? (
                <View style={[s.unread, { backgroundColor: theme.accent }]}>
                  <Text style={[s.unreadT, { color: theme.accentInk }]}>{c.unread}</Text>
                </View>
              ) : (
                <Txt v="tiny">{c.lastMessage ? time(c.lastMessage.at) : ''}</Txt>
              )}
            </Press>
          ))}
        </View>

        {convs.length === 0 && (
          <View style={{ alignItems: 'center', gap: 12, padding: 30 }}>
            <Text style={{ fontSize: 44 }}>💬</Text>
            <Txt v="h2" center>Pas encore de match</Txt>
            <Txt v="small" center>Likez des profils dans Découvrir. Quand c'est réciproque, la conversation s'ouvre ici.</Txt>
            <Button title="Découvrir" icon="flame" onPress={() => router.push('/discover')} />
          </View>
        )}
      </Screen>
      <UpsellSheet reason={upsell ? 'likers' : null} onClose={() => setUpsell(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  likers: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, padding: 14, borderRadius: 20, borderWidth: 1, backgroundColor: Base.surface, overflow: 'hidden' },
  freshName: { fontFamily: Fonts.bodySemi, fontSize: 13, color: Base.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
  name: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Base.ink },
  prev: { fontFamily: Fonts.body, fontSize: 14, color: Base.ink2 },
  unread: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadT: { fontFamily: Fonts.bodyBold, fontSize: 12 },
});
