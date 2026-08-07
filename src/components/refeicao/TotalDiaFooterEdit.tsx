import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { colors, spacing } from '@/theme/colors';
import { useEditDietaStore } from '@/stores/useEditDietaStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { calcMacros, somarMacros } from '@/utils/macros';
import type { DiaSemana } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MacroRing } from './MacroRing';

interface Props { dia: DiaSemana; }

export function TotalDiaFooterEdit({ dia }: Props) {
  const insets = useSafeAreaInsets();

  const refeicoes = useEditDietaStore(
    (s) => s.dietaEditada?.semanas.find((sem) => sem.numero === s.semanaAtiva)?.dias.find((d) => d.nome === dia)?.refeicoes
  );
  const targets = useEditDietaStore((s) => s.dietaEditada?.targets);
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

  const progress = useMemo(() => {
    if (!targets) return undefined;
    return {
      proteina: calcPercent(total.proteina, targets.proteinG),
      carbo:    calcPercent(total.carbo,    targets.carbG),
      gordura:  calcPercent(total.gordura,  targets.fatG),
      calorias: calcPercent(total.calorias, targets.calories),
    };
  }, [targets, total]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {targets && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>META</Text>
          <MetaChip label="P" valor={`${targets.proteinG}g`} cor={colors.macroProtein} />
          <MetaChip label="G" valor={`${targets.fatG}g`}    cor={colors.macroFat} />
          <MetaChip label="C" valor={`${targets.carbG}g`}   cor={colors.macroCarb} />
          <MetaChip label="Cal" valor={`${targets.calories}`} cor={colors.macroCal} />
        </View>
      )}

      {targets ? (
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <CardMacro label="Proteína" valor={`${total.proteina}g`} cor={colors.macroProtein} percent={progress?.proteina} />
            <CardMacro label="Gordura"  valor={`${total.gordura}g`}  cor={colors.macroFat}     percent={progress?.gordura} />
          </View>
          <View style={styles.gridRow}>
            <CardMacro label="Carbo"    valor={`${total.carbo}g`}    cor={colors.macroCarb}    percent={progress?.carbo} />
            <CardMacro label="Calorias" valor={`${total.calorias}`}  cor={colors.macroCal}     percent={progress?.calorias} />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <CardMacro label="Proteína" valor={`${total.proteina}g`} cor={colors.macroProtein} />
          <CardMacro label="Carbo"    valor={`${total.carbo}g`}    cor={colors.macroCarb} />
          <CardMacro label="Gordura"  valor={`${total.gordura}g`}  cor={colors.macroFat} />
          <CardMacro label="Calorias" valor={`${total.calorias}`}  cor={colors.macroCal} />
        </View>
      )}
    </View>
  );
}

function calcPercent(atual: number, alvo: number): number {
  if (!Number.isFinite(alvo) || alvo <= 0) return 0;
  return (atual / alvo) * 100;
}

function MetaChip({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}: </Text>
      <Text style={[styles.chipValor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

interface CardProps {
  label: string;
  valor: string;
  cor: string;
  percent?: number;
}

function CardMacro({ label, valor, cor, percent }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTextCol}>
        <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
        <Text style={[styles.cardValor, { color: cor }]} numberOfLines={1}>{valor}</Text>
      </View>
      {percent !== undefined && (
        <MacroRing percent={percent} />
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipValor: {
    fontSize: 12,
    fontWeight: '800',
  },
  grid: { gap: spacing.sm },
  gridRow: { flexDirection: 'row', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
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
  cardTextCol: { flex: 1, gap: 4 },
  cardLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.4 },
  cardValor: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
});
