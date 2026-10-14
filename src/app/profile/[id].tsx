import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Carousel } from '@/components/media';
import { Sheet } from '@/components/overlays';
import { ProfileBody } from '@/components/ProfileBody';
import { Button, IconButton, Row, Screen, Txt } from '@/components/ui';
import { UpsellSheet, type UpsellReason } from '@/components/Upsell';
import { Rules } from '@/lib/rules';
import type { Profile, ReportReason } from '@/services/types';
import { useApp, useServices } from '@/store/app';
import { Base } from '@/theme/tokens';

const REASONS: { id: ReportReason; label: string }[] = [
  { id: 'fake', label: 'Faux profil' },
  { id: 'scam', label: 'Arnaque ou demande d’argent' },
  { id: 'inappropriate', label: 'Photos ou propos inappropriés' },
  { id: 'harassment', label: 'Harcèlement' },
  { id: 'minor', label: 'Semble mineur·e' },
  { id: 'other', label: 'Autre' },
];

export default function ProfileView() {
  const { id, matched } = useLocalSearchParams<{ id: string; matched?: string }>();
  const svc = useServices();
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [p, setP] = useState<Profile | null>(null);
  const [isMatch, setIsMatch] = useState(matched === '1');
  const [report, setReport] = useState(false);
  const [upsell, setUpsell] = useState<UpsellReason | null>(null);

  useEffect(() => {
    void svc.profile.getProfile(id).then(setP);
    void svc.chat.list().then((l) => setIsMatch((m) => m || l.some((c) => c.peer.id === id)));
  }, [svc, id]);

  if (!p) return <View style={{ flex: 1, backgroundColor: Base.bg }} />;
  const platinumLocked = p.tier === 3 && !Rules.canSeePlatinum(app.tier) && !isMatch;
  const photos = p.photos.filter((x) => x.kind !== 'private' || Rules.canSeePrivatePhotos(isMatch));

  async function decide(like: boolean) {
    if (like && !app.consumeLike()) return setUpsell('likes');
    if (like) {
      const r = await svc.discovery.like(id);
      if (r.matched && r.conversationId) {
        app.showToast(`C'est un match avec ${p!.firstName} ! 🎉`, 'ok');
        router.replace({ pathname: '/chat/[id]', params: { id: r.conversationId } });
        return;
      }
    } else await svc.discovery.pass(id);
    router.back();
  }

  async function openChat() {
    const conv = (await svc.chat.list()).find((c) => c.peer.id === id);
    if (conv) router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Base.bg }}>
      <Screen padded={false}>
        {platinumLocked ? (
          <View style={{ paddingTop: insets.top + 80, padding: 24, gap: 14, alignItems: 'center' }}>
            <Txt v="h1" center>Profil Platinum</Txt>
            <Txt v="small" center>Les membres Platinum ne sont montrés qu'aux membres Gold et Platinum.</Txt>
            <Button title="Passer à Gold" icon="star" onPress={() => setUpsell('platinum')} />
          </View>
        ) : (
          <>
            <Carousel profile={p} photos={photos} style={{ width: '100%', aspectRatio: 3 / 4, maxHeight: 640 }} rounded={0} lockedFrom={Rules.canSeeAllPhotos(app.tier) || isMatch ? undefined : 1} onLockedPress={() => setUpsell('photos')} />
            <View style={{ paddingHorizontal: 20 }}>
              <ProfileBody p={p} />
              {!isMatch && p.photos.some((x) => x.kind === 'private') && <Txt v="small" style={{ marginTop: 14 }}>🔐 {p.firstName} a une photo privée, visible après un match.</Txt>}
              <Button title={`Signaler ou bloquer ${p.firstName}`} variant="ghost" icon="flag-outline" shine={false} onPress={() => setReport(true)} style={{ marginTop: 24 }} />
            </View>
          </>
        )}
      </Screen>
      <Row style={[s.top, { top: insets.top + 8 }]}>
        <IconButton name="chevron-down" label="Fermer" bg="rgba(0,0,0,0.45)" onPress={() => router.back()} />
      </Row>
      {!platinumLocked && (
        <View style={[s.bar, { paddingBottom: insets.bottom + 14 }]}>
          {isMatch ? (
            <Button title="Écrire" icon="chatbubble" onPress={openChat} style={{ flex: 1 }} />
          ) : (
            <>
              <Button title="Passer" variant="dark" icon="close" onPress={() => decide(false)} style={{ flex: 1 }} shine={false} />
              <Button title="Liker" icon="heart" onPress={() => decide(true)} style={{ flex: 1.4 }} />
            </>
          )}
        </View>
      )}

      <Sheet visible={report} onClose={() => setReport(false)} title={`Signaler ${p.firstName}`}>
        <Txt v="small">Votre signalement est anonyme. Notre équipe de modération l'examine rapidement.</Txt>
        {REASONS.map((r) => (
          <Button
            key={r.id}
            title={r.label}
            variant="dark"
            shine={false}
            onPress={async () => {
              await svc.moderation.report(p.id, r.id);
              setReport(false);
              app.showToast('Merci, la modération va examiner ce profil', 'ok');
            }}
          />
        ))}
        <Button
          title={`Bloquer ${p.firstName}`}
          variant="ghost"
          icon="ban"
          ink={Base.danger}
          shine={false}
          onPress={async () => {
            await svc.moderation.block(p.id);
            setReport(false);
            app.showToast(`${p.firstName} est bloqué·e`);
            router.replace('/discover');
          }}
        />
      </Sheet>
      <UpsellSheet reason={upsell} onClose={() => setUpsell(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', left: 16 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, backgroundColor: 'rgba(13,10,14,0.92)', borderTopWidth: 1, borderTopColor: Base.line },
});
