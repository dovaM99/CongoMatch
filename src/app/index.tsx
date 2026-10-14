import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Row } from '@/components/ui';
import { useApp } from '@/store/app';
import { Base, Fonts } from '@/theme/tokens';

const VIDEO = require('@/assets/media/landing.mp4');
const POSTER = require('@/assets/media/landing-poster.jpg');

export default function Landing() {
  const { session, onboarded } = useApp();
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  if (session && onboarded) return <Redirect href="/discover" />;
  if (session && !onboarded) return <Redirect href="/onboarding" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Image source={POSTER} style={StyleSheet.absoluteFill} contentFit="cover" />
        <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />
      </View>
      <LinearGradient colors={['rgba(13,10,14,0.85)', 'rgba(13,10,14,0.15)', 'rgba(13,10,14,0)']} locations={[0, 0.3, 0.5]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(13,10,14,0)', 'rgba(13,10,14,0.7)', 'rgba(13,10,14,0.98)']} locations={[0.45, 0.72, 1]} style={StyleSheet.absoluteFill} />

      <View style={[s.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeIn.duration(900)} style={s.brand}>
          <Image source={require('@/assets/images/logo.png')} style={s.logo} contentFit="contain" />
          <Text style={s.tag}>Plus qu'une rencontre, une histoire d'ici.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={{ gap: 12 }}>
          <Button title="Créer un compte" icon="heart" onPress={() => router.push({ pathname: '/auth/phone', params: { mode: 'signup' } })} grad={['#FF5A86', '#E0245E', '#A0103F']} ink="#fff" />
          <Button title="J'ai déjà un compte" variant="glass" onPress={() => router.push({ pathname: '/auth/phone', params: { mode: 'login' } })} />
          <Row style={{ justifyContent: 'center', marginTop: 6 }} gap={12}>
            <Text style={s.bank}>Brazzaville</Text>
            <Text style={[s.bank, { color: Base.rose }]}>♥</Text>
            <Text style={s.bank}>Kinshasa</Text>
          </Row>
          <Text style={s.legal}>En continuant, vous confirmez avoir 18 ans ou plus et acceptez les conditions d'utilisation.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 6 },
  logo: { width: '100%', aspectRatio: 1024 / 373, maxWidth: 420 },
  tag: { fontFamily: Fonts.bodyMedium, fontSize: 16.5, color: 'rgba(255,255,255,0.92)', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 12 },
  bank: { fontFamily: Fonts.bodyBold, fontSize: 15, color: '#fff' },
  legal: { fontFamily: Fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4 },
});
