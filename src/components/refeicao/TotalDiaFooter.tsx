import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { colors, spacing } from '@/theme/colors';
import { useDietasStore } from '@/stores/useDietasStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { calcMacros, somarMacros } from '@/utils/macros';
import type { DiaSemana } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  dietaId: string;
  dia: DiaSemana;
  semanaNumero?: number;
}

// ─── Paleta semafórica pastel ────────────────────────────────
// < 50%    → vermelho
// 50–96%   → amarelo
// 97–103%  → verde
// > 103%   → amarelo
// > 115%   → vermelho

const TIER = {
  green:  { bg: '#DCFCE7', border: '#86EFAC' },
  yellow: { bg: '#FEF9C3', border: '#FDE047' },
  red:    { bg: '#FEE2E2', border: '#FCA5A5' },
  none:   { bg: '#FFFFFF', border: colors.border },
} as const;

type TierKey = keyof typeof TIER;

function getTier(pct: number): TierKey {
  if (!Number.isFinite(pct) || pct < 50) return 'red';
  if (pct > 115) return 'red';
  if (pct >= 97 && pct <= 103) return 'green';
  return 'yellow';
}

export function TotalDiaFooter({ dietaId, dia, semanaNumero = 1 }: Props) {
  const insets = useSafeAreaInsets();

  const refeicoes = useDietasStore(
    (s) => s.byId[dietaId]?.semanas.find((sem) => sem.numero === semanaNumero)?.dias.find((d) => d.nome === dia)?.refeicoes
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

  const tiers = useMemo(() => {
    if (!targets) return null;
    const pct = (v: number, t: number) => t > 0 ? (v / t) * 100 : 0;
    return {
      proteina: getTier(pct(total.proteina, targets.proteinG)),
      carbo:    getTier(pct(total.carbo,    targets.carbG)),
      gordura:  getTier(pct(total.gordura,  targets.fatG)),
      calorias: getTier(pct(total.calorias, targets.calories)),
    };
  }, [targets, total]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Text style={styles.titulo}>Total do Dia</Text>
      <View style={styles.row}>
        <CardMacro label="Proteína" valor={`${total.proteina}g`} cor={colors.macroProtein} tier={tiers?.proteina} />
        <CardMacro label="Carbo"    valor={`${total.carbo}g`}    cor={colors.macroCarb}    tier={tiers?.carbo} />
        <CardMacro label="Gordura"  valor={`${total.gordura}g`}  cor={colors.macroFat}     tier={tiers?.gordura} />
        <CardMacro label="Calorias" valor={`${total.calorias}`}  cor={colors.macroCal}     tier={tiers?.calorias} />
      </View>
    </View>
  );
}

function CardMacro({
  label, valor, cor, tier,
}: {
  label: string;
  valor: string;
  cor: string;
  tier?: TierKey;
}) {
  const palette = TIER[tier ?? 'none'];
  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValor, { color: cor }]}>{valor}</Text>
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
  row: { flexDirection: 'row', gap: spacing.sm },
  card: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
  },
  cardLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  cardValor: { fontSize: 15, fontWeight: '700' },
});
