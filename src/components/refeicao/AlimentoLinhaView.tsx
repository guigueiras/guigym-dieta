import { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { calcMacros } from '@/utils/macros';
import { formatQuantidade } from '@/utils/format';
import { MacroChip } from './MacroChip';

interface Props {
  alimentoId: string;
  quantidade: number;
}

function AlimentoLinhaViewBase({ alimentoId, quantidade }: Props) {
  const base = useAlimentosStore((s) => s.byId[alimentoId]);

  const macros = useMemo(
    () => (base ? calcMacros(base, quantidade) : null),
    [base, quantidade]
  );

  if (!base || !macros) return null;

  return (
    <View style={styles.linha}>
      <View style={styles.linhaTop}>
        <Text style={styles.alimentoNome} numberOfLines={1}>{base.nome}</Text>
        <Text style={styles.alimentoQtd}>{formatQuantidade(quantidade, base.unidade)}</Text>
      </View>
      <View style={styles.macrosRow}>
        <MacroChip label="P" valor={`${macros.proteina}g`} cor={colors.macroProtein} />
        <MacroChip label="C" valor={`${macros.carbo}g`}    cor={colors.macroCarb} />
        <MacroChip label="G" valor={`${macros.gordura}g`}  cor={colors.macroFat} />
      </View>
    </View>
  );
}

export const AlimentoLinhaView = memo(AlimentoLinhaViewBase);

const styles = StyleSheet.create({
  linha: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    gap: 4,
  },
  linhaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  alimentoNome: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  alimentoQtd: { fontSize: 14, fontWeight: '600', color: colors.text },
  macrosRow: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
});
