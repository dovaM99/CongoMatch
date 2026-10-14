import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/store/app';
import { Base, Fonts } from '@/theme/tokens';

import { Shine } from './Shine';
import { Press, type IconName } from './ui';

const ICONS: Record<string, [IconName, IconName, string]> = {
  discover: ['flame', 'flame-outline', 'Découvrir'],
  likes: ['heart', 'heart-outline', 'Likes'],
  messages: ['chatbubbles', 'chatbubbles-outline', 'Messages'],
  plans: ['diamond', 'diamond-outline', 'Forfaits'],
  profile: ['person', 'person-outline', 'Profil'],
};

/**
 * Floating frosted-glass menu. The tint follows the subscription theme and
 * every button carries the travelling light.
 */
export function GlassTabBar({ state, navigation, badges = {} }: BottomTabBarProps & { badges?: Record<string, boolean> }) {
  const insets = useSafeAreaInsets();
  const { theme } = useApp();
  return (
    <View pointerEvents="box-none" style={[s.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[s.bar, { shadowColor: theme.glow }]}>
        <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassTint }]} />
        <LinearGradient colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)']} style={[StyleSheet.absoluteFill, { height: '55%' }]} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const [on, off, label] = ICONS[route.name] ?? ['ellipse', 'ellipse-outline', route.name];
          return (
            <Press
              key={route.key}
              accessibilityLabel={label}
              scaleTo={0.88}
              style={s.item}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
              }}>
              <View style={[s.pill, focused && { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)' }]}>
                {focused && <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFill} />}
                <Shine color={focused ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.10)'} delay={index * 260} every={4200} duration={1100} />
                <Ionicons name={focused ? on : off} size={23} color={focused ? theme.accent : Base.ink2} />
                {badges[route.name] && <View style={s.dot} />}
              </View>
              <Text style={[s.label, focused && { color: Base.ink }]}>{label}</Text>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 14 },
  bar: { flexDirection: 'row', width: '100%', maxWidth: 520, borderRadius: 30, overflow: 'hidden', paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  pill: { width: 54, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  label: { fontFamily: Fonts.bodySemi, fontSize: 11, color: Base.ink2 },
  dot: { position: 'absolute', top: 5, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: Base.rose },
});
