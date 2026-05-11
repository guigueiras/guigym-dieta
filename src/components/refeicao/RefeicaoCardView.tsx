import { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { colors, spacing } from '@/theme/colors';
import { useDietasStore } from '@/stores/useDietasStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { calcMacros, somarMacros } from '@/utils/macros';
import { MacrosBar } from './MacrosBar';
import { EmptyRefeicao } from './EmptyRefeicao';
import { AlimentoLinhaView } from './AlimentoLinhaView';
import type { DiaSemana } from '@/types';

interface Props {
  dietaId: string;
  dia: DiaSemana;
  refeicaoId: string;
}

function RefeicaoCardViewBase({ dietaId, dia, refeicaoId }: Props) {
  const { nome, alimentos } = useDietasStore(
    useShallow((s) => {
      const ref = s.byId[dietaId]?.dias.find((d) => d.nome === dia)
        ?.refeicoes.find((r) => r.id === refeicaoId);
      return {
        nome: ref?.nome ?? '',
        alimentos: ref?.alimentos ?? [],
      };
    })
  );

  const alimentosBase = useAlimentosStore(useShallow((s) => s.byId));
  const totaisRefeicao = useMemo(() => {
    const lista = alimentos
      .map((a) => alimentosBase[a.alimentoId] ? calcMacros(alimentosBase[a.alimentoId], a.quantidade) : null)
      .filter(Boolean) as ReturnType<typeof calcMacros>[];
    return somarMacros(lista);
  }, [alimentos, alimentosBase]);

  const vazia = alimentos.length === 0;

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>{nome}</Text>

      {vazia ? (
        <EmptyRefeicao />
      ) : (
        <>
          <View style={styles.alimentos}>
            {alimentos.map((a) => (
              <AlimentoLinhaView key={a.id} alimentoId={a.alimentoId} quantidade={a.quantidade} />
            ))}
          </View>
          <MacrosBar macros={totaisRefeicao} />
        </>
      )}
    </View>
  );
}

export const RefeicaoCardView = memo(RefeicaoCardViewBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  titulo: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  alimentos: { gap: spacing.sm },
});
