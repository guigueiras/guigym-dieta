import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';
import type { MacrosCalculados } from '@/utils/macros';

interface Props { macros: MacrosCalculados; }

export function MacrosBar({ macros }: Props) {
  return (
    <View style={styles.wrap}>
      <Coluna label="Proteína" valor={`${macros.proteina}g`} cor={colors.macroProtein} />
      <Coluna label="Carbo"    valor={`${macros.carbo}g`}    cor={colors.macroCarb} />
      <Coluna label="Gordura"  valor={`${macros.gordura}g`}  cor={colors.macroFat} />
      <Coluna label="Calorias" valor={`${macros.calorias}`}  cor={colors.macroCal} />
    </View>
  );
}

function Coluna({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <View style={styles.col}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.valor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.successLight,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  col: { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  valor: { fontSize: 14, fontWeight: '700' },
});
