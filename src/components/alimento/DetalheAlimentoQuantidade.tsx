import { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import { QuantidadeInputGrande, type QuantidadeInputGrandeRef } from './QuantidadeInputGrande';
import { calcMacros } from '@/utils/macros';
import type { Alimento } from '@/types';

interface Props {
  alimento: Alimento;
  quantidade: number;
  onChangeQuantidade: (q: number) => void;
  onVoltar: () => void;
  visible: boolean;
}

export function DetalheAlimentoQuantidade({
  alimento, quantidade, onChangeQuantidade, onVoltar, visible,
}: Props) {
  const inputRef = useRef<QuantidadeInputGrandeRef>(null);

  const macrosBase = calcMacros(alimento, 100);
  const macrosTotal = calcMacros(alimento, quantidade);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={onVoltar}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Voltar para a lista"
        >
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2.4} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>

        <Text style={styles.titulo} numberOfLines={1}>{alimento.nome}</Text>

        <View style={styles.headerSpacer} />
      </View>

      <BottomSheetScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(200)} style={styles.cardBase}>
          <Text style={styles.cardTitulo}>Valores por 100{alimento.unidade}:</Text>
          <View style={styles.macrosRow}>
            <MacroColuna label="Proteína" valor={macrosBase.proteina} cor={colors.macroProtein} />
            <MacroColuna label="Carbo"    valor={macrosBase.carbo}    cor={colors.macroCarb} />
            <MacroColuna label="Gordura"  valor={macrosBase.gordura}  cor={colors.macroFat} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(220).delay(60)} style={styles.inputBlock}>
          <Text style={styles.inputLabel}>
            Quantidade ({alimento.unidade === 'ml' ? 'mililitros' : 'gramas'})
          </Text>
          <QuantidadeInputGrande
            ref={inputRef}
            value={quantidade}
            onCommit={onChangeQuantidade}
            min={1}
            max={9999}
            step={5}
            autoFocus={visible}
            focusDelayMs={340}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(220).delay(120)} style={styles.cardTotal}>
          <Text style={styles.cardTituloTotal}>
            Total com <Text style={styles.cardTituloTotalBold}>{quantidade}{alimento.unidade}</Text>:
          </Text>
          <View style={styles.macrosRow}>
            <MacroColuna label="Proteína" valor={macrosTotal.proteina} cor={colors.macroProtein} />
            <MacroColuna label="Carbo"    valor={macrosTotal.carbo}    cor={colors.macroCarb} />
            <MacroColuna label="Gordura"  valor={macrosTotal.gordura}  cor={colors.macroFat} />
          </View>
        </Animated.View>
      </BottomSheetScrollView>
    </View>
  );
}

function MacroColuna({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <View style={styles.macroCol}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValor, { color: cor }]}>{valor}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingRight: 8,
    marginLeft: -4,
  },
  backBtnPressed: { opacity: 0.5 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '500' },
  titulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 64 },
  scrollFlex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    paddingBottom: 100,
    gap: spacing.md,
  },
  cardBase: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitulo: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  inputBlock: { gap: spacing.sm },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  cardTotal: {
    backgroundColor: colors.successLight,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#A7F3D0',
  },
  cardTituloTotal: { fontSize: 13, fontWeight: '600', color: colors.successText },
  cardTituloTotalBold: { fontWeight: '800', color: colors.successText },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroCol: { alignItems: 'center', gap: 4, minWidth: 72 },
  macroLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  macroValor: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
});