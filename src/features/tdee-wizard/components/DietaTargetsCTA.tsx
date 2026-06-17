import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { useDieta } from '@/stores/useDietasStore';

interface Props {
  dietaId: string;
}

/**
 * CTA exibido na tela da dieta.
 *
 *  - Sem targets configurados → banner "Definir meta nutricional"
 *  - Com targets configurados → resumo compacto "Meta: 2206 kcal · cutting"
 *
 * Em ambos os casos, toque abre o wizard (rota /dieta/calculadora).
 */
export function DietaTargetsCTA({ dietaId }: Props) {
  const dieta = useDieta(dietaId);
  if (!dieta?.targets) return null;
  const targets = dieta.targets;
  return (
    <View style={styles.filled}>
      <View style={styles.filledLeft}>
        <Text style={styles.filledLabel}>META</Text>
        <Text style={styles.filledValue}>
          {Math.round(targets.calories)} kcal
        </Text>
      </View>
      <View style={styles.filledMacros}>
        <MacroChip label="P" value={Math.round(targets.proteinG)} color={colors.macroProtein} />
        <MacroChip label="C" value={Math.round(targets.carbG)} color={colors.macroCarb} />
        <MacroChip label="G" value={Math.round(targets.fatG)} color={colors.macroFat} />
      </View>
    </View>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Meta configurada — somente visualização
  filled: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    gap: spacing.md,
  },
  filledLeft: { gap: 2 },
  filledLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  filledValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  filledMacros: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
});