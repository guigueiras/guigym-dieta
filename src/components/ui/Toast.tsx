import { useEffect } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, runOnJS, Easing,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/colors';

interface Props {
  visible: boolean;
  mensagem: string;
  onHide: () => void;
  duration?: number;
}

export function Toast({ visible, mensagem, onHide, duration = 1800 }: Props) {
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(60);
  const op = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      ty.value = withSequence(
        withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }),
        withDelay(duration, withTiming(80, { duration: 220, easing: Easing.in(Easing.cubic) }, (fin) => {
          if (fin) runOnJS(onHide)();
        })),
      );
      op.value = withSequence(
        withTiming(1, { duration: 220 }),
        withDelay(duration, withTiming(0, { duration: 220 })),
      );
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { bottom: insets.bottom + 100 },
        style,
      ]}
    >
      <Check size={18} color="#FFFFFF" strokeWidth={2.6} />
      <Text style={styles.text}>{mensagem}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
