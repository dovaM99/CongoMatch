import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/store/app';
import { Base, Fonts, Radius } from '@/theme/tokens';

import { Press, Txt } from './ui';

export type Option<T extends string> = { value: T; label: string; left?: string; right?: string; badge?: string; disabled?: boolean };

/** Dropdown that opens a bottom list. Disabled options stay tappable so the caller can explain why. */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  disabledMessage,
  placeholder = 'Choisir',
}: {
  label?: string;
  value?: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  /** Message shown inside the list when a disabled option is tapped. */
  disabledMessage?: (o: Option<T>) => string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const cur = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 7 }}>
      {label && <Txt v="label">{label}</Txt>}
      <Press onPress={() => setOpen(true)} style={s.box} accessibilityLabel={label ?? placeholder}>
        {cur?.left && <Text style={{ fontSize: 22 }}>{cur.left}</Text>}
        <View style={{ flex: 1 }}>
          <Text style={[s.val, !cur && { color: Base.ink3 }]}>{cur?.label ?? placeholder}</Text>
          {cur?.right && <Text style={s.sub}>{cur.right}</Text>}
        </View>
        <Ionicons name="chevron-down" size={18} color={Base.ink2} />
      </Press>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => { setOpen(false); setNotice(null); }}>
        <Pressable style={s.scrim} onPress={() => { setOpen(false); setNotice(null); }}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.grab} />
          {label && <Txt v="h2" style={{ marginBottom: 8 }}>{label}</Txt>}
          {notice && (
            <View style={s.notice}>
              <Text style={s.noticeT}>{notice}</Text>
            </View>
          )}
          <ScrollView style={{ maxHeight: 460 }}>
            {options.map((o) => {
              const on = o.value === value;
              return (
                <Press
                  key={o.value}
                  scaleTo={0.98}
                  onPress={() => {
                    if (o.disabled) {
                      setNotice(disabledMessage?.(o) ?? 'Bientôt disponible');
                      return;
                    }
                    setNotice(null);
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={[s.opt, on && { borderColor: theme.accent, backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                  {o.left && <Text style={{ fontSize: 24, opacity: o.disabled ? 0.55 : 1 }}>{o.left}</Text>}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.val, o.disabled && { color: Base.ink2 }]}>{o.label}</Text>
                    {o.right && <Text style={s.sub}>{o.right}</Text>}
                  </View>
                  {o.badge && (
                    <View style={s.badge}>
                      <Text style={s.badgeT}>{o.badge}</Text>
                    </View>
                  )}
                  {on && <Ionicons name="checkmark-circle" size={22} color={theme.accent} />}
                </Press>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Base.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Base.line, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56 },
  val: { fontFamily: Fonts.bodySemi, fontSize: 16, color: Base.ink },
  sub: { fontFamily: Fonts.body, fontSize: 13, color: Base.ink2 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Base.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 6, borderWidth: 1, borderColor: Base.line, maxWidth: 560, alignSelf: 'center', width: '100%' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Base.lineStrong, marginBottom: 10 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(242,179,61,0.16)', borderWidth: 1, borderColor: 'rgba(242,179,61,0.4)' },
  notice: { padding: 12, borderRadius: Radius.md, backgroundColor: 'rgba(242,179,61,0.14)', borderWidth: 1, borderColor: 'rgba(242,179,61,0.4)', marginBottom: 8 },
  noticeT: { fontFamily: Fonts.bodySemi, fontSize: 14, color: Base.ink },
  badgeT: { fontFamily: Fonts.bodyBold, fontSize: 11.5, color: Base.warn },
});
