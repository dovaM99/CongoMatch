import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useApp } from '@/store/app';
import { Base } from '@/theme/tokens';

import { Row, Txt } from './ui';

const THUMB = 28;

/** One or two thumbs. Pass `high` for a range. */
export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  low,
  high,
  onChange,
  format = (v) => String(v),
  disabled,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  low: number;
  high?: number;
  onChange: (low: number, high?: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  const { theme } = useApp();
  const [w, setW] = useState(0);
  const isRange = high !== undefined;
  const span = max - min;

  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  const startX = useSharedValue(0);
  // keep shared values in sync with props
  useEffect(() => {
    if (!w) return;
    lowX.value = ((low - min) / span) * w;
    if (high !== undefined) highX.value = ((high - min) / span) * w;
  }, [w, low, high, min, span, lowX, highX]);

  const emit = (lx: number, hx: number) => {
    const snap = (x: number) => Math.round((min + (x / w) * span) / step) * step;
    onChange(snap(lx), isRange ? snap(hx) : undefined);
  };

  const makePan = (which: 'low' | 'high') =>
    Gesture.Pan()
      .enabled(!disabled)
      .onBegin(() => {
        startX.value = which === 'low' ? lowX.value : highX.value;
      })
      .onUpdate((e) => {
        let x = Math.min(w, Math.max(0, startX.value + e.translationX));
        if (which === 'low' && isRange) x = Math.min(x, highX.value - 8);
        if (which === 'high') x = Math.max(x, lowX.value + 8);
        if (which === 'low') lowX.value = x;
        else highX.value = x;
        scheduleOnRN(emit, lowX.value, highX.value);
      });

  const lowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lowX.value - THUMB / 2 }] }));
  const highStyle = useAnimatedStyle(() => ({ transform: [{ translateX: highX.value - THUMB / 2 }] }));
  const fillStyle = useAnimatedStyle(() => ({ left: isRange ? lowX.value : 0, width: (isRange ? highX.value : lowX.value) - (isRange ? lowX.value : 0) }));

  return (
    <View style={{ gap: 12, opacity: disabled ? 0.5 : 1 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="label">{label}</Txt>
        <Txt v="h3" style={{ fontSize: 15 }}>
          {format(low)}
          {isRange ? ` – ${format(high!)}` : ''}
        </Txt>
      </Row>
      <View style={s.wrap} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={s.track} />
        <Animated.View style={[s.fill, { backgroundColor: theme.accent }, fillStyle]} />
        <GestureDetector gesture={makePan('low')}>
          <Animated.View hitSlop={12} style={[s.thumb, { borderColor: theme.accent }, lowStyle]} />
        </GestureDetector>
        {isRange && (
          <GestureDetector gesture={makePan('high')}>
            <Animated.View hitSlop={12} style={[s.thumb, { borderColor: theme.accent }, highStyle]} />
          </GestureDetector>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: THUMB, justifyContent: 'center', marginHorizontal: THUMB / 2 },
  track: { position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 3, backgroundColor: Base.surface2 },
  fill: { position: 'absolute', height: 5, borderRadius: 3 },
  thumb: { position: 'absolute', left: 0, width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: '#fff', borderWidth: 3, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});
