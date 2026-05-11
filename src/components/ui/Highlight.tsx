import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  highlightKey?: string | number;
  active?: boolean;
}

export function Highlight({ children, highlightKey, active }: Props) {
  const bg = useSharedValue(0);

  useEffect(() => {
    if (highlightKey === undefined && !active) return;
    bg.value = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
      withDelay(280, withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }))
    );
  }, [highlightKey, active]);

  const style = useAnimatedStyle(() => ({
    backgroundColor: bg.value === 0
      ? 'transparent'
      : `rgba(16, 185, 129, ${0.18 * bg.value})`,
    transform: [{ scale: 1 + 0.012 * bg.value }],
  }));

  return <Animated.View style={[styles.wrap, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14 },
});
