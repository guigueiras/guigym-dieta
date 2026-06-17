import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { colors, spacing } from '@/theme/colors';
import { useDietasStore } from '@/stores/useDietasStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { calcMacros, somarMacros } from '@/utils/macros';
import type { DiaSemana } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MacroRing } from './MacroRing';

interface Props {
  dietaId: string;
  dia: DiaSemana;
}

export function TotalDiaFooter({ dietaId, dia }: Props) {
  const insets = useSafeAreaInsets();

  const refeicoes = useDietasStore(
    (s) => s.byId[dietaId]?.dias.find((d) => d.nome === dia)?.refeicoes
  );

  const targets = useDietasStore((s) => s.byId[dietaId]?.targets);

  const alimentosBase = useAlimentosStore((s) => s.byId);

  const total = useMemo(() => {
    if (!refeicoes) return { proteina: 0, carbo: 0, gordura: 0, calorias: 0 };
    const lista: ReturnType<typeof calcMacros>[] = [];
    for (const r of refeicoes) {
      for (const a of r.alimentos) {
        const base = alimentosBase[a.alimentoId];
        if (base) lista.push(calcMacros(base, a.quantidade));
      }
    }
    return somarMacros(lista);
  }, [refeicoes, alimentosBase]);

  // Calcula % de progresso por macro quando há meta. Sem meta → undefined.
  const progress = useMemo(() => {
    if (!targets) return undefined;
    return {
      proteina: calcPercent(total.proteina, targets.proteinG),
      carbo: calcPercent(total.carbo, targets.carbG),
      gordura: calcPercent(total.gordura, targets.fatG),
      calorias: calcPercent(total.calorias, targets.calories),
    };
  }, [targets, total]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Text style={styles.titulo}>Total do Dia</Text>
      {targets ? (
        <View style={styles.grid}>
          <View style={styles.row}>
            <CardMacro label="Proteína" valor={`${total.proteina}g`} cor={colors.macroProtein} percent={progress?.proteina} />
            <CardMacro label="Gordura" valor={`${total.gordura}g`} cor={colors.macroFat} percent={progress?.gordura} />
          </View>
          <View style={styles.row}>
            <CardMacro label="Carbo" valor={`${total.carbo}g`} cor={colors.macroCarb} percent={progress?.carbo} />
            <CardMacro label="Calorias" valor={`${total.calorias}`} cor={colors.macroCal} percent={progress?.calorias} />
          </View>
        </View>
      ) : (
        <View style={styles.rowSingle}>
          <CardMacro label="Proteína" valor={`${total.proteina}g`} cor={colors.macroProtein} compact />
          <CardMacro label="Gordura" valor={`${total.gordura}g`} cor={colors.macroFat} compact />
          <CardMacro label="Carbo" valor={`${total.carbo}g`} cor={colors.macroCarb} compact />
          <CardMacro label="Calorias" valor={`${total.calorias}`} cor={colors.macroCal} compact />
        </View>
      )}
    </View>
  );
}

function calcPercent(atual: number, alvo: number): number {
  if (!Number.isFinite(alvo) || alvo <= 0) return 0;
  return (atual / alvo) * 100;
}

interface CardProps {
  label: string;
  valor: string;
  cor: string;
  /** Percentual de progresso vs alvo. Undefined = sem meta (não renderiza o anel). */
  percent?: number;
  /** Layout compacto para o grid 1×4 (sem meta). */
  compact?: boolean;
}

function CardMacro({ label, valor, cor, percent, compact }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTextCol}>
        <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
        <Text
          style={[styles.cardValor, { color: cor, fontSize: compact ? 15 : 18 }]}
          numberOfLines={1}
        >
          {valor}
        </Text>
      </View>
      {percent !== undefined && (
        <View style={styles.cardRingCol}>
          <MacroRing percent={percent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.md,
    backgroundColor: '#F0F6FF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  titulo: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.1 },
  grid: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowSingle: { flexDirection: 'row', gap: spacing.sm },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardTextCol: {
    flex: 1,
    gap: 4,
  },
  cardRingCol: {
    flexShrink: 0,
  },
  cardValor: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
