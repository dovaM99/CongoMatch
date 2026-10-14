import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { remaining } from '@/lib/format';
import type { Promo } from '@/services/types';
import { useApp } from '@/store/app';
import { Base, Fonts } from '@/theme/tokens';

import { Shine } from './Shine';
import { Press, Txt } from './ui';

export function Sheet({ visible, onClose, children, title }: { visible: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(21,15,23,0.86)' }]} />
        <View style={s.grab} />
        {title && <Txt v="h2" style={{ marginBottom: 6 }}>{title}</Txt>}
        <ScrollView style={{ maxHeight: 620 }} contentContainerStyle={{ gap: 14 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function ToastHost() {
  const { toast } = useApp();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <Animated.View key={toast.id} entering={FadeInDown.springify()} exiting={FadeOutUp} pointerEvents="none" style={[s.toast, { top: insets.top + 10 }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <Text style={s.toastT}>{toast.text}</Text>
    </Animated.View>
  );
}

/** Ticks every second towards the admin-set end date. Never resets. */
export function useCountdown(endsAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return endsAt ? remaining(endsAt, now) : null;
}

export function Countdown({ endsAt, color = '#fff' }: { endsAt: string; color?: string }) {
  const r = useCountdown(endsAt);
  if (!r || r.ms <= 0) return <Text style={[s.cd, { color }]}>Terminé</Text>;
  return <Text style={[s.cd, { color }]}>{r.label}</Text>;
}

export function PromoBanner({ promo, onPress, compact }: { promo: Promo; onPress?: () => void; compact?: boolean }) {
  const r = useCountdown(promo.endsAt);
  if (!r || r.ms <= 0) return null;
  return (
    <Press onPress={onPress} style={s.promo} scaleTo={0.98}>
      <LinearGradient colors={['#FF3D6E', '#B3123F', '#5A0A24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Shine color="rgba(255,255,255,0.3)" />
      <View style={s.off}>
        <Text style={s.offT}>-{promo.percentOff}%</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.promoT} numberOfLines={1}>{promo.title}</Text>
        {!compact && <Text style={s.promoS}>Offre limitée, se termine dans</Text>}
      </View>
      <View style={s.timer}>
        <Text style={s.cd}>{r.label}</Text>
      </View>
    </Press>
  );
}

const s = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: Base.line, maxWidth: 560, alignSelf: 'center', width: '100%' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Base.lineStrong, marginBottom: 14 },
  toast: { position: 'absolute', alignSelf: 'center', maxWidth: 420, marginHorizontal: 20, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Base.lineStrong, zIndex: 100 },
  toastT: { fontFamily: Fonts.bodySemi, fontSize: 14.5, color: '#fff', textAlign: 'center' },
  cd: { fontFamily: Fonts.display, fontSize: 14, color: '#fff', fontVariant: ['tabular-nums'] },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, overflow: 'hidden' },
  off: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 },
  offT: { fontFamily: Fonts.display, fontSize: 15, color: '#B3123F' },
  promoT: { fontFamily: Fonts.bodyBold, fontSize: 15, color: '#fff' },
  promoS: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  timer: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
});
