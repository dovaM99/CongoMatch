import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { INTENTIONS, type MarketId, type TierId } from '@/data/catalog';
import { ageFrom, Rules } from '@/lib/rules';
import type { Profile } from '@/services/types';
import { Base, Fonts } from '@/theme/tokens';

import { Carousel, TierBadge, Verified, pill } from './media';
import { Button, Press } from './ui';

export type SwipeDir = 'left' | 'right';
export type SwipeCardHandle = { swipe: (dir: SwipeDir) => void };

type Props = {
  profile: Profile;
  viewerTier: TierId;
  viewerMarket: MarketId;
  onSwiped: (dir: SwipeDir) => void;
  onInfo: () => void;
  onUpsell: (reason: 'photos' | 'platinum') => void;
  active: boolean;
};

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard({ profile: p, viewerTier, viewerMarket, onSwiped, onInfo, onUpsell, active }, ref) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const limit = Math.min(width, 520) * 0.28;

  const fly = (dir: SwipeDir) => {
    'worklet';
    x.value = withTiming(dir === 'right' ? width * 1.4 : -width * 1.4, { duration: 260 }, () => scheduleOnRN(onSwiped, dir));
  };
  useImperativeHandle(ref, () => ({ swipe: (dir) => fly(dir) }));

  const pan = Gesture.Pan()
    .enabled(active)
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY * 0.4;
    })
    .onEnd((e) => {
      if (Math.abs(x.value) > limit || Math.abs(e.velocityX) > 900) fly(x.value > 0 ? 'right' : 'left');
      else {
        x.value = withSpring(0, { damping: 14 });
        y.value = withSpring(0, { damping: 14 });
      }
    });

  const card = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${interpolate(x.value, [-width, width], [-14, 14])}deg` }],
  }));
  const likeS = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, limit], [0, 1], 'clamp') }));
  const nopeS = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-limit, 0], [1, 0], 'clamp') }));

  const platinumLocked = p.tier === 3 && !Rules.canSeePlatinum(viewerTier);
  const photos = p.photos.filter((ph) => ph.kind !== 'private');
  const intention = INTENTIONS.find((i) => i.id === p.intention);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[StyleSheet.absoluteFill, s.card, card]}>
        <Carousel profile={p} photos={photos} style={StyleSheet.absoluteFill} rounded={26} lockedFrom={Rules.canSeeAllPhotos(viewerTier) || platinumLocked ? undefined : 1} onLockedPress={() => onUpsell('photos')}>
          <LinearGradient colors={['transparent', 'rgba(8,5,9,0.55)', 'rgba(8,5,9,0.95)']} locations={[0.45, 0.7, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {!platinumLocked && (
            <View style={s.meta} pointerEvents="box-none">
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {p.tier > 0 && <TierBadge tier={p.tier} market={p.market ?? viewerMarket} size="sm" />}
                {intention && (
                  <View style={[pill.base, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                    <Text style={pill.text}>{intention.emoji} {intention.label}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.name}>
                  {p.firstName}, <Text style={{ fontFamily: Fonts.displayMedium }}>{ageFrom(p.birthDate)}</Text>
                </Text>
                {p.verified && <Verified size={22} />}
              </View>
              <Text style={s.where}>📍 {p.district ? `${p.district}, ` : ''}{p.city}{p.distanceKm !== undefined ? ` · ${p.distanceKm} km` : ''}</Text>
              <Text style={s.bio} numberOfLines={2}>{p.bio}</Text>
              <Press onPress={onInfo} style={s.info} accessibilityLabel="Voir le profil complet">
                <Ionicons name="arrow-up" size={20} color="#fff" />
              </Press>
            </View>
          )}
        </Carousel>
        {platinumLocked && (
          <View style={[StyleSheet.absoluteFill, s.plat]}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <TierBadge tier={3} market={p.market} />
            <Text style={s.platT}>{p.firstName}, {ageFrom(p.birthDate)} · {p.city}</Text>
            <Text style={s.platS}>Les membres Platinum sont visibles à partir de Gold.</Text>
            <Button title="Débloquer avec Gold" icon="star" onPress={() => onUpsell('platinum')} style={{ alignSelf: 'stretch' }} />
          </View>
        )}
        <Animated.View style={[s.stamp, s.like, likeS]}>
          <Text style={[s.stampT, { color: Base.ok }]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[s.stamp, s.nope, nopeS]}>
          <Text style={[s.stampT, { color: Base.danger }]}>NON</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const s = StyleSheet.create({
  card: { borderRadius: 26, backgroundColor: Base.surface, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  meta: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 7 },
  name: { fontFamily: Fonts.display, fontSize: 30, color: '#fff', letterSpacing: -0.6 },
  where: { fontFamily: Fonts.bodySemi, fontSize: 14.5, color: 'rgba(255,255,255,0.9)' },
  bio: { fontFamily: Fonts.body, fontSize: 14.5, lineHeight: 20, color: 'rgba(255,255,255,0.8)', paddingRight: 50 },
  info: { position: 'absolute', right: 0, bottom: 0, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stamp: { position: 'absolute', top: 48, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 4, borderRadius: 12 },
  like: { left: 24, borderColor: Base.ok, transform: [{ rotate: '-14deg' }] },
  nope: { right: 24, borderColor: Base.danger, transform: [{ rotate: '14deg' }] },
  stampT: { fontFamily: Fonts.display, fontSize: 32, letterSpacing: 2 },
  plat: { borderRadius: 26, overflow: 'hidden', backgroundColor: 'rgba(15,20,27,0.55)', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  platT: { fontFamily: Fonts.display, fontSize: 20, color: '#fff', textAlign: 'center' },
  platS: { fontFamily: Fonts.body, fontSize: 14.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
});
