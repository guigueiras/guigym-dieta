import { Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import type { CalorieDelta } from '../../hooks/useWizardCalculation';

interface Props {
  delta: CalorieDelta;
}

/**
 * Label contextual que aparece sob o kcal em destaque no TargetCard.
 *
 * Exemplos:
 *   - Déficit de 553 kcal/dia
 *   - Meta de manutenção
 *   - Superávit de 277 kcal/dia
 *
 * Sem ícone — comunicação via texto + cor sutil semântica.
 */
export function DeltaContextLabel({ delta }: Props) {
  const text = formatDelta(delta);
  const color = colorForDelta(delta.kind);

  return <Text style={[styles.label, { color }]}>{text}</Text>;
}

function formatDelta(delta: CalorieDelta): string {
  switch (delta.kind) {
    case 'deficit':
      return `Déficit de ${delta.amount} kcal/dia`;
    case 'surplus':
      return `Superávit de ${delta.amount} kcal/dia`;
    case 'maintenance':
      return 'Meta de manutenção';
    default:
      return '';
  }
}

function colorForDelta(kind: CalorieDelta['kind']): string {
  switch (kind) {
    case 'deficit':
      return colors.warning;
    case 'surplus':
      return colors.successText;
    case 'maintenance':
      return colors.textSecondary;
    default:
      return colors.textSecondary;
  }
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});