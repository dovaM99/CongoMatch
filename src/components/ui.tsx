import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/store/app';
import { Base, Fonts, Radius, Space } from '@/theme/tokens';

import { Shine } from './Shine';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/* ---------- text ---------- */
type TxtProps = TextProps & { v?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'label' | 'tiny'; color?: string; center?: boolean };
export function Txt({ v = 'body', color, center, style, ...rest }: TxtProps) {
  return <Text {...rest} style={[T[v], color ? { color } : null, center ? { textAlign: 'center' } : null, style]} />;
}
const T = StyleSheet.create({
  display: { fontFamily: Fonts.display, fontSize: 32, lineHeight: 38, color: Base.ink, letterSpacing: -0.8 },
  h1: { fontFamily: Fonts.display, fontSize: 25, lineHeight: 31, color: Base.ink, letterSpacing: -0.5 },
  h2: { fontFamily: Fonts.display, fontSize: 19, lineHeight: 25, color: Base.ink, letterSpacing: -0.3 },
  h3: { fontFamily: Fonts.bodyBold, fontSize: 17, lineHeight: 22, color: Base.ink },
  body: { fontFamily: Fonts.body, fontSize: 15.5, lineHeight: 22, color: Base.ink },
  small: { fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 19, color: Base.ink2 },
  label: { fontFamily: Fonts.bodyBold, fontSize: 11.5, letterSpacing: 1.1, textTransform: 'uppercase', color: Base.ink2 },
  tiny: { fontFamily: Fonts.bodySemi, fontSize: 11, color: Base.ink3 },
});

/* ---------- pressable with spring ---------- */
export function Press({
  children,
  onPress,
  style,
  disabled,
  scaleTo = 0.96,
  haptic = true,
  accessibilityLabel,
  hitSlop,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  haptic?: boolean;
  accessibilityLabel?: string;
  hitSlop?: number;
}) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  // Layout props go on the Pressable so `flex`, `width`, `alignSelf` work from the outside.
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const { flex, flexGrow, flexShrink, flexBasis, alignSelf, width, margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, position, top, left, right, bottom, ...inner } = flat;
  const outer: ViewStyle = { flex, flexGrow, flexShrink, flexBasis, alignSelf, width, margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, position, top, left, right, bottom };
  const innerStyle: ViewStyle = flex || flexGrow || width ? { ...inner, flexGrow: 1 } : inner;
  return (
    <Pressable
      style={outer}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => (s.value = withSpring(scaleTo, { damping: 15, stiffness: 400 }))}
      onPressOut={() => (s.value = withSpring(1, { damping: 12, stiffness: 300 }))}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}>
      <Animated.View style={[innerStyle, a, disabled && { opacity: 0.45 }]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ---------- buttons ---------- */
type BtnProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'glass' | 'dark';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  grad?: readonly [string, string, ...string[]];
  ink?: string;
  shine?: boolean;
};
export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, size = 'md', style, grad, ink, shine = true }: BtnProps) {
  const { theme } = useApp();
  const colors = grad ?? theme.grad;
  const fg = ink ?? (variant === 'primary' ? theme.accentInk : Base.ink);
  const pad = size === 'sm' ? { paddingVertical: 10, paddingHorizontal: 14, minHeight: 40 } : { paddingVertical: 15, paddingHorizontal: 18, minHeight: 54 };
  return (
    <Press onPress={onPress} disabled={disabled || loading} style={[styles.btn, size === 'sm' && { borderRadius: 12 }, style]} accessibilityLabel={title}>
      {variant === 'primary' && <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      {variant === 'ghost' && <View style={[StyleSheet.absoluteFill, styles.ghost]} />}
      {variant === 'glass' && <View style={[StyleSheet.absoluteFill, styles.glass]} />}
      {variant === 'dark' && <View style={[StyleSheet.absoluteFill, { backgroundColor: Base.surface2 }]} />}
      {shine && !disabled && <Shine color={variant === 'primary' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} />}
      <View style={[styles.btnInner, pad]}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={fg} />}
            <Text style={[styles.btnText, { color: fg }, size === 'sm' && { fontSize: 14 }]}>{title}</Text>
          </>
        )}
      </View>
    </Press>
  );
}

export function IconButton({ name, onPress, size = 40, color = Base.ink, bg = 'rgba(255,255,255,0.08)', label, badge }: { name: IconName; onPress?: () => void; size?: number; color?: string; bg?: string; label: string; badge?: boolean }) {
  return (
    <Press onPress={onPress} accessibilityLabel={label} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Ionicons name={name} size={size * 0.5} color={color} />
      {badge && <View style={styles.dot} />}
    </Press>
  );
}

/* ---------- chip ---------- */
export function Chip({ label, selected, onPress, icon, locked }: { label: string; selected?: boolean; onPress?: () => void; icon?: string; locked?: boolean }) {
  const { theme } = useApp();
  return (
    <Press onPress={onPress} scaleTo={0.94} style={[styles.chip, selected && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
      {selected && <Shine color="rgba(255,255,255,0.3)" every={4200} />}
      <Text style={[styles.chipText, selected && { color: theme.accentInk }]}>
        {icon ? `${icon} ` : ''}
        {label}
        {locked ? ' 🔒' : ''}
      </Text>
    </Press>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

/* ---------- field ---------- */
export function Field({ label, hint, prefix, style, inputStyle, ...rest }: TextInputProps & { label?: string; hint?: string; prefix?: string; inputStyle?: StyleProp<TextStyle> }) {
  const { theme } = useApp();
  return (
    <View style={[{ gap: 7 }, style as ViewStyle]}>
      {label && <Txt v="label">{label}</Txt>}
      <View style={styles.field}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput placeholderTextColor={Base.ink3} selectionColor={theme.accent} {...rest} style={[styles.input, inputStyle]} />
      </View>
      {hint && <Txt v="tiny">{hint}</Txt>}
    </View>
  );
}

/* ---------- layout ---------- */
export function Screen({ children, scroll = true, padded = true, bottomInset = true, style }: { children: ReactNode; scroll?: boolean; padded?: boolean; bottomInset?: boolean; style?: StyleProp<ViewStyle> }) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[{ gap: Space.lg, paddingBottom: bottomInset ? insets.bottom + 110 : insets.bottom + 24 }, padded && { paddingHorizontal: Space.xl }, style]}>{children}</View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: Base.bg }}>
      <LinearGradient colors={theme.wash} style={styles.wash} pointerEvents="none" />
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </View>
  );
}

export function Header({ title, back = true, right, onBack, sub }: { title?: string; back?: boolean; right?: ReactNode; onBack?: () => void; sub?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {back ? <IconButton name="chevron-back" label="Retour" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/discover')))} /> : null}
      <View style={{ flex: 1 }}>
        {title ? <Txt v="h2" numberOfLines={1}>{title}</Txt> : null}
        {sub ? <Txt v="small" numberOfLines={1}>{sub}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, gap = 10, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Steps({ total, at }: { total: number; at: number }) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i <= at ? theme.accent : Base.line }} />
      ))}
    </View>
  );
}

export function Kente({ height = 6 }: { height?: number }) {
  return (
    <View style={{ height, borderRadius: height, overflow: 'hidden', flexDirection: 'row' }}>
      {Array.from({ length: 24 }, (_, i) => (
        <View key={i} style={{ flex: i % 3 === 0 ? 2 : 1, backgroundColor: Base.kente[i % Base.kente.length] }} />
      ))}
    </View>
  );
}

export function Toggle({ value, onChange, locked }: { value: boolean; onChange: (v: boolean) => void; locked?: boolean }) {
  const { theme } = useApp();
  return (
    <Press onPress={() => onChange(!value)} scaleTo={0.9} style={[styles.toggle, value && { backgroundColor: theme.accent }]}>
      <View style={[styles.knob, value && { transform: [{ translateX: 20 }] }]}>{locked && <Text style={{ fontSize: 10 }}>🔒</Text>}</View>
    </Press>
  );
}

export const styles = StyleSheet.create({
  btn: { borderRadius: Radius.md, overflow: 'hidden', alignSelf: 'stretch' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: Fonts.bodyBold, fontSize: 16, letterSpacing: 0.1 },
  ghost: { borderWidth: 1.5, borderColor: Base.lineStrong, borderRadius: Radius.md },
  glass: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: Radius.md },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: Radius.pill, borderWidth: 1, borderColor: Base.lineStrong, backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  chipText: { fontFamily: Fonts.bodySemi, fontSize: 14, color: Base.ink },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: Base.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Base.line, paddingHorizontal: 14 },
  prefix: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Base.ink2, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontFamily: Fonts.bodyMedium, fontSize: 16, color: Base.ink, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  wash: { position: 'absolute', left: 0, right: 0, top: 0, height: 360 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Space.lg, paddingBottom: 10 },
  card: { backgroundColor: Base.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Base.line, padding: Space.lg, gap: Space.md },
  dot: { position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: Base.rose, borderWidth: 1.5, borderColor: Base.bg },
  toggle: { width: 50, height: 30, borderRadius: 15, backgroundColor: Base.surface2, padding: 3, borderWidth: 1, borderColor: Base.line },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
