import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Carousel, Coins } from '@/components/media';
import { ProfileBody } from '@/components/ProfileBody';
import { Shine } from '@/components/Shine';
import { IconButton, Press, Row, Screen, Txt } from '@/components/ui';
import { tierById } from '@/data/catalog';
import { useApp } from '@/store/app';
import { Base, Fonts } from '@/theme/tokens';

export default function MyProfile() {
  const { me, coins, tier, theme, market } = useApp();
  const insets = useSafeAreaInsets();
  if (!me) return null;
  const t = tierById(tier);
  const pending = me.photos.filter((p) => p.moderation === 'pending').length;

  return (
    <Screen padded={false}>
      <View>
        <Carousel profile={me} photos={me.photos} style={{ width: '100%', aspectRatio: 3 / 4, maxHeight: 620 }} rounded={0}>
          <LinearGradient colors={['rgba(13,10,14,0.6)', 'transparent']} style={[StyleSheet.absoluteFill, { height: 140 }]} pointerEvents="none" />
          <LinearGradient colors={['transparent', Base.bg]} style={[StyleSheet.absoluteFill, { top: '70%' }]} pointerEvents="none" />
          <Row style={[s.top, { top: insets.top + 8 }]}>
            <Press onPress={() => router.push('/wallet')} style={s.wallet} accessibilityLabel="Mes pièces, visible uniquement par vous">
              <Ionicons name="lock-closed" size={12} color={Base.ink2} />
              <Coins n={coins} size={14} />
            </Press>
            <View style={{ flex: 1 }} />
            <IconButton name="settings-outline" label="Réglages" bg="rgba(0,0,0,0.4)" onPress={() => router.push('/settings')} />
          </Row>
          <Press onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1', step: '3' } })} style={[s.edit, { backgroundColor: theme.accent }]}>
            <Shine color="rgba(255,255,255,0.3)" />
            <Ionicons name="pencil" size={16} color={theme.accentInk} />
            <Text style={[s.editT, { color: theme.accentInk }]}>Modifier</Text>
          </Press>
        </Carousel>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 18 }}>
        {pending > 0 && <Txt v="small">⏳ {pending} photo{pending > 1 ? 's' : ''} en cours de vérification par la modération.</Txt>}
        <ProfileBody p={me} />
        <Press onPress={() => router.push('/plans')} style={[s.tier, { borderColor: theme.accent }]}>
          <LinearGradient colors={theme.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: 0.18 }]} />
          <Shine color="rgba(255,255,255,0.12)" />
          <Text style={{ fontSize: 26, color: theme.accent }}>{theme.crest}</Text>
          <View style={{ flex: 1 }}>
            <Txt v="h3">{t ? `${t.name} · ${t.local[market]}` : 'Forfait Gratuit'}</Txt>
            <Txt v="small">{t ? `Thème ${t.theme} actif · gérer mon forfait` : 'Découvrez Plus, Gold et Platinum'}</Txt>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Base.ink2} />
        </Press>
        <Press onPress={() => router.push('/onboarding?edit=1')} style={s.row}>
          <Ionicons name="create-outline" size={22} color={Base.ink} />
          <Txt style={{ flex: 1 }}>Modifier mes infos et ma bio</Txt>
          <Ionicons name="chevron-forward" size={18} color={Base.ink3} />
        </Press>
        <Press onPress={() => router.push('/wallet')} style={s.row}>
          <Text style={{ fontSize: 20 }}>🪙</Text>
          <View style={{ flex: 1 }}>
            <Txt>Mes Pièces</Txt>
            <Txt v="tiny">🔒 Solde visible uniquement par vous</Txt>
          </View>
          <Coins n={coins} />
        </Press>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', left: 16, right: 16 },
  wallet: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)' },
  edit: { position: 'absolute', right: 16, bottom: 26, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, overflow: 'hidden' },
  editT: { fontFamily: Fonts.bodyBold, fontSize: 14 },
  tier: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, backgroundColor: Base.surface, borderWidth: 1, borderColor: Base.line },
});
