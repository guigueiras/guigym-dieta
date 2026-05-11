import { memo, useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, Pressable, StyleSheet, Keyboard, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { Minus, Plus } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';

export interface QuantidadeInputGrandeRef {
  focus: () => void;
  blur: () => void;
}

interface Props {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  autoFocus?: boolean;
  focusDelayMs?: number;
}

function QuantidadeInputGrandeBase(
  {
    value, onCommit, min = 1, max = 9999, step = 5, autoFocus = false, focusDelayMs = 320,
  }: Props,
  ref: React.Ref<QuantidadeInputGrandeRef>
) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => inputRef.current?.focus(), focusDelayMs);
    return () => clearTimeout(t);
  }, [autoFocus, focusDelayMs]);

  const borderProgress = useSharedValue(0);
  useEffect(() => {
    borderProgress.value = withTiming(focused ? 1 : 0, {
      duration: 180, easing: Easing.out(Easing.quad),
    });
  }, [focused]);

  const containerAnim = useAnimatedStyle(() => ({
    borderColor: borderProgress.value > 0.5 ? colors.primary : colors.border,
    shadowOpacity: 0.04 + borderProgress.value * 0.10,
    shadowRadius: 8 + borderProgress.value * 8,
  }));

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withSequence(
      withTiming(1.06, { duration: 110, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
    );
  }, [value]);
  const inputPulse = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const sanitize = (raw: string) => raw.replace(/[^0-9]/g, '').slice(0, 5);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      setText(String(value));
      return;
    }
    let n = parseInt(trimmed, 10);
    if (!Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    if (n < min) n = min;
    if (n > max) n = max;

    setText(String(n));
    if (n !== value) onCommit(n);
  };

  const stepBy = (delta: number) => {
    let n = value + delta;
    if (n < min) n = min;
    if (n > max) n = max;
    if (n === value) {
      hap.error();
      return;
    }
    hap.select();
    setText(String(n));
    onCommit(n);
  };

  return (
    <Animated.View style={[styles.container, containerAnim]}>
      <Pressable
        onPress={() => stepBy(-step)}
        hitSlop={10}
        disabled={value <= min}
        style={({ pressed }) => [
          styles.stepBtn,
          pressed && !(value <= min) && styles.stepBtnPressed,
          value <= min && styles.stepBtnDisabled,
        ]}
      >
        <Minus size={22} color={value <= min ? colors.textMuted : colors.text} strokeWidth={2.4} />
      </Pressable>

      <Animated.View style={[styles.inputWrap, inputPulse]}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={(v) => setText(sanitize(v))}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); commit(text); }}
          onSubmitEditing={() => { commit(text); Keyboard.dismiss(); }}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          style={styles.input}
          maxLength={5}
          selectTextOnFocus
          textAlign="center"
          allowFontScaling={false}
          autoCorrect={false}
        />
      </Animated.View>

      <Pressable
        onPress={() => stepBy(step)}
        hitSlop={10}
        disabled={value >= max}
        style={({ pressed }) => [
          styles.stepBtn,
          pressed && !(value >= max) && styles.stepBtnPressed,
          value >= max && styles.stepBtnDisabled,
        ]}
      >
        <Plus size={22} color={value >= max ? colors.textMuted : colors.text} strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
}

export const QuantidadeInputGrande = memo(forwardRef(QuantidadeInputGrandeBase));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 80,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: '100%',
    textAlignVertical: 'center',
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? ({ fontFeatureSettings: '"tnum"' } as any) : {}),
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: {
    backgroundColor: colors.surfaceAlt,
    transform: [{ scale: 0.94 }],
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
});
