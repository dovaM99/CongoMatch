import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { PASSION_EMOJI, type MarketId, type TierId, tierById } from '@/data/catalog';
import type { Photo, Profile } from '@/services/types';
import { Base, Fonts, TierThemes } from '@/theme/tokens';

const GRADS: [string, string][] = [
  ['#C2305A', '#F08A4B'], ['#0F5C5C', '#5FB49C'], ['#5B3A8C', '#C2305A'], ['#B3841E', '#E35D3A'],
  ['#1E4E8C', '#0F5C5C'], ['#7A2E48', '#D96A8A'], ['#3E7A43', '#B3841E'], ['#2B2F5A', '#8A5861'],
];

/** Renders a real photo, a demo gradient (`demo:` scheme) or the team logo (`team:`). */
export function ProfilePhoto({ photo, profile, style, blur, big = true }: { photo?: Photo; profile: Profile; style?: StyleProp<ViewStyle>; blur?: boolean; big?: boolean }) {
  const uri = photo?.uri ?? '';
  let inner;
  if (uri.startsWith('team:')) {
    inner = (
      <LinearGradient colors={['#2A0F1C', '#0D0A0E']} style={StyleSheet.absoluteFill}>
        <Image source={require('@/assets/images/logo-mark.png')} style={{ flex: 1, margin: '18%' }} contentFit="contain" />
      </LinearGradient>
    );
  } else if (uri.startsWith('demo:') || !uri) {
    const [, g = '0', slot = '0'] = uri.split(':');
    const grad = GRADS[Number(g) % GRADS.length];
    const passion = profile.passions[(Number(slot) || 0) - 1];
    inner = (
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: `${(i * 37) % 90}%`, top: `${(i * 53) % 85}%`, width: 120, height: 120, borderRadius: 60, borderWidth: 18, borderColor: '#fff' }} />
          ))}
        </View>
        {slot === 'p' ? (
          <Text style={{ fontSize: big ? 64 : 22 }}>🔥</Text>
        ) : slot === '0' || !passion ? (
          <Text style={{ fontFamily: Fonts.display, fontSize: big ? 120 : 26, color: 'rgba(255,255,255,0.88)' }}>{profile.firstName.charAt(0)}</Text>
        ) : (
          <Text style={{ fontSize: big ? 110 : 26 }}>{PASSION_EMOJI[passion] ?? '✨'}</Text>
        )}
      </LinearGradient>
    );
  } else {
    inner = <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />;
  }
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: Base.surface2 }, style]}>
      {inner}
      {blur && <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />}
    </View>
  );
}

export function Avatar({ profile, size = 52, ring, blur }: { profile: Profile; size?: number; ring?: string; blur?: boolean }) {
  const photo = profile.photos.find((p) => p.kind === 'portrait') ?? profile.photos[0];
  return (
    <View style={{ width: size + (ring ? 6 : 0), height: size + (ring ? 6 : 0), borderRadius: size, borderWidth: ring ? 2.5 : 0, borderColor: ring, padding: ring ? 1.5 : 0 }}>
      <ProfilePhoto photo={photo} profile={profile} big={false} blur={blur} style={{ width: size - (ring ? 1 : 0), height: size - (ring ? 1 : 0), borderRadius: size / 2 }} />
    </View>
  );
}

/**
 * Photo carousel, Tinder style: tap left/right, segments on top.
 * `lockedFrom`: index from which photos are hidden for the viewer's tier.
 */
export function Carousel({
  profile,
  photos,
  style,
  lockedFrom,
  onLockedPress,
  children,
  rounded = 24,
}: {
  profile: Profile;
  photos: Photo[];
  style?: StyleProp<ViewStyle>;
  lockedFrom?: number;
  onLockedPress?: () => void;
  children?: React.ReactNode;
  rounded?: number;
}) {
  const [i, setI] = useState(0);
  const n = Math.max(1, photos.length);
  const idx = Math.min(i, n - 1);
  const locked = lockedFrom !== undefined && idx >= lockedFrom;
  const cur = photos[idx];
  return (
    <View style={[{ borderRadius: rounded, overflow: 'hidden', backgroundColor: Base.surface }, style]}>
      <ProfilePhoto photo={cur} profile={profile} style={StyleSheet.absoluteFill} blur={locked} />
      {cur?.kind === 'private' && !locked && (
        <View style={[pill.base, { position: 'absolute', top: 26, right: 12, backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <Text style={pill.text}>🔐 Photo privée · visible par les matchs</Text>
        </View>
      )}
      {n > 1 && (
        <View style={c.segs}>
          {Array.from({ length: n }, (_, k) => (
            <View key={k} style={[c.seg, k === idx && { backgroundColor: '#fff' }]} />
          ))}
        </View>
      )}
      {n > 1 && (
        <>
          <Pressable accessibilityLabel="Photo précédente" style={[c.tap, { left: 0 }]} onPress={() => setI(Math.max(0, idx - 1))} />
          <Pressable accessibilityLabel="Photo suivante" style={[c.tap, { right: 0 }]} onPress={() => setI(Math.min(n - 1, idx + 1))} />
        </>
      )}
      {locked && (
        <Pressable onPress={onLockedPress} style={c.lock}>
          <Ionicons name="lock-closed" size={30} color="#fff" />
          <Text style={c.lockT}>{n - (lockedFrom ?? 0)} photo{n - (lockedFrom ?? 0) > 1 ? 's' : ''} de plus</Text>
          <Text style={c.lockS}>Toutes les photos sont visibles dès Plus</Text>
        </Pressable>
      )}
      {children}
    </View>
  );
}

export function TierBadge({ tier, market, size = 'md' }: { tier: TierId; market: MarketId; size?: 'sm' | 'md' }) {
  const t = tierById(tier);
  if (!t) return null;
  const th = TierThemes[tier];
  return (
    <LinearGradient colors={th.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[pill.base, size === 'sm' && { paddingVertical: 3, paddingHorizontal: 8 }]}>
      <Text style={[pill.text, { color: th.accentInk }, size === 'sm' && { fontSize: 11 }]}>
        {th.crest} {t.name} · {t.local[market]}
      </Text>
    </LinearGradient>
  );
}

export function TeamBadge() {
  return (
    <View style={[pill.base, { backgroundColor: Base.rose }]}>
      <Text style={[pill.text, { color: '#fff' }]}>✓ Compte officiel CongoMatch</Text>
    </View>
  );
}

export function Verified({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Base.verified, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="checkmark" size={size * 0.65} color="#fff" />
    </View>
  );
}

export function Coin({ size = 16 }: { size?: number }) {
  return (
    <LinearGradient colors={['#FFE08A', '#E2A72E', '#B57A12']} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFF1B8' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: size * 0.5, color: '#7A4D06' }}>C</Text>
    </LinearGradient>
  );
}

export function Coins({ n, size = 15 }: { n: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Coin size={size + 2} />
      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: size, color: Base.ink }}>{n.toLocaleString('fr-FR')}</Text>
    </View>
  );
}

export const pill = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  text: { fontFamily: Fonts.bodyBold, fontSize: 12, color: '#fff', lineHeight: 16 },
});

const c = StyleSheet.create({
  segs: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 3.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  tap: { position: 'absolute', top: 0, bottom: '35%', width: '45%' },
  lock: { position: 'absolute', left: 0, right: 0, top: '28%', alignItems: 'center', gap: 6, padding: 20 },
  lockT: { fontFamily: Fonts.bodyBold, fontSize: 17, color: '#fff' },
  lockS: { fontFamily: Fonts.body, fontSize: 13.5, color: 'rgba(255,255,255,0.8)' },
});
