import { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { QuantidadeInputGrande, type QuantidadeInputGrandeRef } from './QuantidadeInputGrande';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { calcMacros } from '@/utils/macros';
import { hap } from '@/utils/haptics';
import type { Alimento } from '@/types';

interface Props {
  alimento: Alimento;
  onVoltar: () => void;
  onConfirmar: (quantidade: number) => void;
  visible: boolean;
}

const QTD_INICIAL = 100;

export function DetalheAlimentoQuantidade({
  alimento, onVoltar, onConfirmar, visible,
}: Props) {
  const [quantidade, setQuantidade] = useState(QTD_INICIAL);
  const inputRef = useRef<QuantidadeInputGrandeRef>(null);

  useEffect(() => {
    setQuantidade(QTD_INICIAL);
  }, [alimento.id]);

  const macrosBase = calcMacros(alimento, 100);
  const macrosTotal = calcMacros(alimento, quantidade);

  const confirmar = () => {
    if (quantidade <= 0) {
      hap.error();
      return;
    }
    onConfirmar(quantidade);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={onVoltar}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2.4} />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>

        <Text style={styles.titulo} numberOfLines={1}>{alimento.nome}</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        overScrollMode="never"
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
            onCommit={setQuantidade}
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
            <MacroColunaAnim label="Proteína" valor={macrosTotal.proteina} cor={colors.macroProtein} />
            <MacroColunaAnim label="Carbo"    valor={macrosTotal.carbo}    cor={colors.macroCarb} />
            <MacroColunaAnim label="Gordura"  valor={macrosTotal.gordura}  cor={colors.macroFat} />
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="primary" onPress={confirmar} disabled={quantidade <= 0}>
          Adicionar
        </Button>
      </View>
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

function MacroColunaAnim({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <View style={styles.macroCol}>
      <Text style={styles.macroLabel}>{label}</Text>
      <AnimatedNumber
        value={valor}
        decimals={1}
        suffix="g"
        style={[styles.macroValor, { color: cor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  cardBase: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  inputBlock: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  cardTotal: {
    backgroundColor: colors.successLight,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#A7F3D0',
  },
  cardTituloTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.successText,
  },
  cardTituloTotalBold: {
    fontWeight: '800',
    color: colors.successText,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroCol: {
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  macroValor: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
});
