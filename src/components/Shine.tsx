import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * A band of light that travels across a surface, the "effet de parcours"
 * on every button. Parent must have overflow: 'hidden'.
 */
export function Shine({
  color = 'rgba(255,255,255,0.38)',
  duration = 1400,
  every = 3200,
  delay = 0,
}: {
  color?: string;
  duration?: number;
  every?: number;
  delay?: number;
}) {
  const [w, setW] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!w) return;
    x.value = 0;
    x.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          withDelay(Math.max(0, every - duration), withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
  }, [w, x, duration, every, delay]);

  const band = Math.max(60, w * 0.45);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -band * 1.5 + x.value * (w + band * 3) }, { skewX: '-20deg' }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Animated.View style={[{ position: 'absolute', top: -10, bottom: -10, width: band }, style]}>
          <LinearGradient
            colors={['transparent', color, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}
