import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/theme/colors';

interface Props {
  /** Nome do macro (ex: "PROTEÍNA"). Renderizado uppercase. */
  name: string;
  /** Gramas alvo. Renderizado como inteiro (já vem arredondado da engine). */
  grams: number;
  /** Percentual do total calórico (0–100). */
  percentOfTotal: number;
  /** Cor da barra preenchida. */
  color: string;
}

/**
 * Linha de macro pro TargetCard.
 *
 * Layout:
 *   PROTEÍNA                166g
 *   ████████████░░░░░░░░    30%
 *
 * Anima a largura da barra quando `percentOfTotal` muda (troca de segmented).
 */
export function MacroBarLarge({ name, grams, percentOfTotal, color }: Props) {
  const widthPct = useSharedValue(percentOfTotal);

  useEffect(() => {
    widthPct.value = withTiming(percentOfTotal, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentOfTotal]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, widthPct.value))}%`,
  }));

  const pctLabel = Math.round(percentOfTotal);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.grams}>{Math.round(grams)}g</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
      </View>

      <Text style={styles.pct}>{pctLabel}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  grams: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  track: {
    height: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.md,
  },
  pct: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});