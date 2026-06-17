import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '@/theme/colors';
import type { MacroTargets } from '@/utils/tdee';
import type { CalorieDelta } from '../../hooks/useWizardCalculation';
import { MacroBarLarge } from './MacroBarLarge';
import { DeltaContextLabel } from './DeltaContextLabel';

interface Props {
  target: MacroTargets;
  delta: CalorieDelta;
}

// Valores nutricionais canônicos (kcal por grama).
// Hardcoded em vez de importar da engine pra manter o barrel público enxuto —
// esses números são universais (não vão mudar) e usados só pra display de %.
const KCAL_PER_GRAM_PROTEIN = 4;
const KCAL_PER_GRAM_CARB = 4;
const KCAL_PER_GRAM_FAT = 9;

/**
 * Card grande do Step 4. Renderiza:
 *   - kcal em destaque
 *   - DeltaContextLabel ("Déficit de 553 kcal/dia", etc.)
 *   - 3× MacroBarLarge (proteína, carbo, gordura) com gramas + barra + %
 *
 * As barras animam quando os macros mudam (troca de segmented). Números kcal
 * e gramas trocam instantâneo — sem flash desnecessário do card inteiro.
 */
export function TargetCard({ target, delta }: Props) {
  // Calcula % do total calórico que cada macro representa
  const kcalProtein = target.proteinG * KCAL_PER_GRAM_PROTEIN;
  const kcalCarb    = target.carbG    * KCAL_PER_GRAM_CARB;
  const kcalFat     = target.fatG     * KCAL_PER_GRAM_FAT;
  const totalKcal = kcalProtein + kcalCarb + kcalFat;

  const pctProtein = totalKcal > 0 ? (kcalProtein / totalKcal) * 100 : 0;
  const pctCarb    = totalKcal > 0 ? (kcalCarb / totalKcal) * 100 : 0;
  const pctFat     = totalKcal > 0 ? (kcalFat / totalKcal) * 100 : 0;

  return (
    <View style={styles.card}>
      {/* Cabeçalho: kcal grande + contexto */}
      <View style={styles.header}>
        <Text style={styles.kcal}>{target.kcal}</Text>
        <Text style={styles.kcalUnit}>kcal/dia</Text>
      </View>

      <DeltaContextLabel delta={delta} />

      {/* Separador sutil */}
      <View style={styles.divider} />

      {/* Macros */}
      <View style={styles.macros}>
        <MacroBarLarge
          name="PROTEÍNA"
          grams={target.proteinG}
          percentOfTotal={pctProtein}
          color={colors.macroProtein}
        />
        <MacroBarLarge
          name="CARBOIDRATO"
          grams={target.carbG}
          percentOfTotal={pctCarb}
          color={colors.macroCarb}
        />
        <MacroBarLarge
          name="GORDURA"
          grams={target.fatG}
          percentOfTotal={pctFat}
          color={colors.macroFat}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  kcal: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.2,
  },
  kcalUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  macros: {
    gap: spacing.lg,
  },
});