import { memo, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming,
} from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { useEditActions } from '@/stores/useEditDietaStore';
import { calcMacros } from '@/utils/macros';
import { MacroChip } from './MacroChip';
import { QuantidadeInput } from './QuantidadeInput';
import { hap } from '@/utils/haptics';
import type { DiaSemana } from '@/types';

interface Props {
  dia: DiaSemana;
  refeicaoId: string;
  alimentoNaRefId: string;
  alimentoId: string;
  quantidade: number;
}

function AlimentoLinhaEditBase({
  dia, refeicaoId, alimentoNaRefId, alimentoId, quantidade,
}: Props) {
  const base = useAlimentosStore((s) => s.byId[alimentoId]);
  const { updateQuantidade, removeAlimento } = useEditActions();

  const macros = useMemo(
    () => (base ? calcMacros(base, quantidade) : null),
    [base, quantidade]
  );

  const trashScale = useSharedValue(1);
  const trashAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: trashScale.value }] }));

  if (!base || !macros) return null;

  const handleRemover = () => {
    trashScale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withTiming(1.1, { duration: 80 }),
      withTiming(1, { duration: 100 })
    );
    hap.remove();
    setTimeout(() => removeAlimento(dia, refeicaoId, alimentoNaRefId), 60);
  };

  return (
    <View style={styles.linha}>
      <View style={styles.linhaTop}>
        <Text style={styles.alimentoNome} numberOfLines={1}>{base.nome}</Text>

        <View style={styles.qtdWrap}>
          <QuantidadeInput
            value={quantidade}
            onCommit={(n) => updateQuantidade(dia, refeicaoId, alimentoNaRefId, n)}
            inputWidth={56}
          />
          <Text style={styles.qtdSuffix}>{base.unidade}</Text>
        </View>

        <Pressable
          onPress={handleRemover}
          hitSlop={8}
          style={({ pressed }) => [styles.delBtn, pressed && styles.delBtnPressed]}
          accessibilityLabel={`Remover ${base.nome}`}
        >
          <Animated.View style={trashAnimStyle}>
            <Trash2 size={17} color={colors.danger} strokeWidth={2.2} />
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.macrosRow}>
        <MacroChip label="P" valor={`${macros.proteina}g`} cor={colors.macroProtein} />
        <MacroChip label="C" valor={`${macros.carbo}g`}    cor={colors.macroCarb} />
        <MacroChip label="G" valor={`${macros.gordura}g`}  cor={colors.macroFat} />
      </View>
    </View>
  );
}

export const AlimentoLinhaEdit = memo(AlimentoLinhaEditBase);

const styles = StyleSheet.create({
  linha: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 4,
  },
  linhaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alimentoNome: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  qtdWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  qtdSuffix: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  delBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  delBtnPressed: { backgroundColor: colors.dangerLight },
  macrosRow: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
});
