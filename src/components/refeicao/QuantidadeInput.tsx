import { memo, useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

interface Props {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  inputWidth?: number;
}

function QuantidadeInputBase({
  value, onCommit, min = 0, max = 9999, inputWidth = 64,
}: Props) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const borderProgress = useSharedValue(0);
  useEffect(() => {
    borderProgress.value = withTiming(focused ? 1 : 0, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  }, [focused]);

  const inputStyle = useAnimatedStyle(() => ({
    borderColor: borderProgress.value > 0.5 ? colors.primary : colors.border,
  }));

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

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.inputWrap, { width: inputWidth }, inputStyle]}>
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
          autoCorrect={false}
          allowFontScaling={false}
        />
      </Animated.View>
    </View>
  );
}

export const QuantidadeInput = memo(QuantidadeInputBase);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inputWrap: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 0,
    paddingHorizontal: 4,
    height: '100%',
    textAlignVertical: 'center',
  },
});
