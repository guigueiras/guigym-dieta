import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, type TextInput as TextInputType,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/theme/colors';

interface Props {
  /** Valor numérico atual. `null` = campo vazio. */
  value: number | null;
  /** Chamado quando o usuário digita um número válido sintaticamente, ou null se apaga tudo. */
  onChange: (value: number | null) => void;
  /** Sufixo visual à direita ('anos', 'kg', 'cm', '%'). */
  suffix: string;
  /** Range opcional [min, max] — se valor fora, mostra borda vermelha + mensagem. */
  range?: readonly [number, number];
  /** Se true, bloqueia ponto/vírgula (apenas inteiros). Default false. */
  integer?: boolean;
  /** Placeholder do TextInput. Default '0'. */
  placeholder?: string;
  /** Se true, foca automaticamente ao montar. */
  autoFocus?: boolean;
  /** Label customizada pra acessibilidade (ex: "Idade"). */
  accessibilityLabel?: string;
}

/**
 * Input numérico premium pro wizard.
 *
 * Visual: campo branco com borda cinza, sufixo fixo à direita, borda animada
 * azul ao focar e vermelha se valor fora do range. Mensagem de erro embaixo.
 *
 * Estado interno: guarda a string digitada (permite digitar decimal sem
 * "engasgar"). Sincroniza com prop `value` (suporta reset externo).
 */
export function NumberFieldPro({
  value,
  onChange,
  suffix,
  range,
  integer = false,
  placeholder = '0',
  autoFocus = false,
  accessibilityLabel,
}: Props) {
  const inputRef = useRef<TextInputType>(null);
  const [text, setText] = useState<string>(value === null ? '' : numberToText(value));
  const [focused, setFocused] = useState(false);

  // Sync prop -> string interna (reset externo, mudança vinda do store)
  useEffect(() => {
    const canonical = value === null ? '' : numberToText(value);
    setText((current) => {
      // Só atualiza se diferente — evita perder cursor enquanto o usuário digita
      const currentNumber = parseInputToNumber(current);
      if (currentNumber === value) return current;
      return canonical;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Validação visual
  const outOfRange =
    value !== null &&
    range !== undefined &&
    (value < range[0] || value > range[1]);

  // Borda animada (cor)
  const borderAnim = useSharedValue(0);
  useEffect(() => {
    // 0 = idle, 1 = focused, 2 = error
    const target = outOfRange ? 2 : focused ? 1 : 0;
    borderAnim.value = withTiming(target, { duration: 180 });
  }, [focused, outOfRange]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderAnim.value,
      [0, 1, 2],
      [colors.border, colors.primary, colors.danger]
    ),
  }));

  const handleChangeText = (raw: string) => {
    // Normaliza vírgula → ponto
    let normalized = raw.replace(',', '.');

    // Filtra caracteres inválidos
    if (integer) {
      normalized = normalized.replace(/[^0-9]/g, '');
    } else {
      // Permite dígitos + 1 ponto decimal
      normalized = normalized.replace(/[^0-9.]/g, '');
      const firstDot = normalized.indexOf('.');
      if (firstDot !== -1) {
        normalized =
          normalized.slice(0, firstDot + 1) +
          normalized.slice(firstDot + 1).replace(/\./g, '');
      }
    }

    setText(normalized);

    if (normalized === '' || normalized === '.') {
      onChange(null);
      return;
    }
    const parsed = parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <View>
      <Animated.View style={[styles.field, animatedBorderStyle]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          accessibilityLabel={accessibilityLabel}
          maxLength={integer ? 3 : 6}
        />
        <Text style={styles.suffix}>{suffix}</Text>
      </Animated.View>

      {outOfRange && range && (
        <Text style={styles.error}>
          Entre {range[0]} e {range[1]} {suffix}
        </Text>
      )}
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function numberToText(n: number): string {
  // Inteiros sem casa decimal; floats com a precisão natural.
  return Number.isInteger(n) ? String(n) : String(n);
}

function parseInputToNumber(s: string): number | null {
  if (s === '' || s === '.') return null;
  const parsed = parseFloat(s);
  return Number.isFinite(parsed) ? parsed : null;
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0, // anula padding default do Android
  },
  suffix: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
    fontSize: 13,
    color: colors.danger,
    fontWeight: '500',
  },
});