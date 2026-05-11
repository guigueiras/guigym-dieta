import { memo, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, spacing, radii } from '@/theme/colors';

interface Props {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  cor?: string;
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return '';
  if (Number.isInteger(n)) return String(n);
  return String(n).replace('.', ',');
}

function MacroInputBase({ label, value, onChange, cor = colors.text }: Props) {
  const [text, setText] = useState(formatNumber(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatNumber(value));
  }, [value, focused]);

  const borderProgress = useSharedValue(0);
  useEffect(() => {
    borderProgress.value = withTiming(focused ? 1 : 0, {
      duration: 150, easing: Easing.out(Easing.quad),
    });
  }, [focused]);

  const wrapStyle = useAnimatedStyle(() => ({
    borderColor: borderProgress.value > 0.5 ? colors.primary : colors.border,
  }));

  const sanitize = (raw: string): string => {
    let cleaned = raw.replace(/[^0-9.,]/g, '');
    let firstSep = -1;
    let out = '';
    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (c === ',' || c === '.') {
        if (firstSep === -1) {
          firstSep = i;
          out += c;
        }
      } else {
        out += c;
      }
    }
    const sepIdx = out.search(/[.,]/);
    if (sepIdx >= 0) {
      const inteiro = out.slice(0, sepIdx).slice(0, 4);
      const decimal = out.slice(sepIdx + 1).slice(0, 1);
      out = inteiro + (out[sepIdx]) + decimal;
    } else {
      out = out.slice(0, 4);
    }
    return out;
  };

  const commit = () => {
    if (text === '' || text === ',' || text === '.') {
      onChange(null);
      setText('');
      return;
    }
    const normalized = text.replace(',', '.');
    const n = parseFloat(normalized);
    if (Number.isFinite(n) && n >= 0) {
      const rounded = Math.round(n * 10) / 10;
      onChange(rounded);
      setText(formatNumber(rounded));
    } else {
      setText(formatNumber(value));
    }
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: cor }]}>{label}</Text>
      <Animated.View style={[styles.inputWrap, wrapStyle]}>
        <TextInput
          value={text}
          onChangeText={(v) => setText(sanitize(v))}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); commit(); }}
          onSubmitEditing={commit}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
          inputMode="decimal"
          returnKeyType="done"
          maxLength={6}
          selectTextOnFocus
          style={styles.input}
          allowFontScaling={false}
        />
      </Animated.View>
    </View>
  );
}

export const MacroInput = memo(MacroInputBase);

const styles = StyleSheet.create({
  field: { flex: 1, gap: 4 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1, opacity: 0.85 },
  inputWrap: {
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    height: '100%',
    fontVariant: ['tabular-nums'],
    ...(Platform.OS === 'web' ? ({ fontFeatureSettings: '"tnum"' } as any) : {}),
  },
});
