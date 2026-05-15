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
}

export function TotalDiaFooter({ dietaId, dia }: Props) {
  const insets = useSafeAreaInsets();

  const refeicoes = useDietasStore(
    (s) => s.byId[dietaId]?.dias.find((d) => d.nome === dia)?.refeicoes
  );

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

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Text style={styles.titulo}>Total do Dia</Text>
      <View style={styles.row}>
        <CardMacro label="Proteína" valor={`${total.proteina}g`}  cor={colors.macroProtein} />
        <CardMacro label="Carbo"    valor={`${total.carbo}g`}     cor={colors.macroCarb} />
        <CardMacro label="Gordura"  valor={`${total.gordura}g`}   cor={colors.macroFat} />
        <CardMacro label="Calorias" valor={`${total.calorias}`}   cor={colors.macroCal} />
      </View>
    </View>
  );
}

function CardMacro({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <View style={styles.card}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  cardValor: { fontSize: 16, fontWeight: '700' },
});
