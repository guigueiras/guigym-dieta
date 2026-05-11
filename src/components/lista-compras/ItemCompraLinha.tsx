import { memo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { formatQuantidade } from '@/utils/format';
import { hap } from '@/utils/haptics';
import { useIsItemMarcado, useListaActions } from '@/stores/useListaComprasUIStore';
import type { UnidadeMedida } from '@/types';

interface Props {
  dietaId: string;
  alimentoId: string;
  nome: string;
  quantidade: number;
  unidade: UnidadeMedida;
}

function ItemCompraLinhaBase({ dietaId, alimentoId, nome, quantidade, unidade }: Props) {
  const marcado = useIsItemMarcado(dietaId, alimentoId);
  const { toggleMarcado } = useListaActions();

  const progress = useSharedValue(marcado ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(marcado ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [marcado]);

  const handlePress = () => {
    hap.select();
    toggleMarcado(dietaId, alimentoId);
  };

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.5,
  }));

  const strikeStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const boxAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0.5 ? colors.success : '#FFFFFF',
    borderColor: progress.value > 0.5 ? colors.success : colors.textMuted,
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  const a11yLabel = `${nome}, ${formatQuantidade(quantidade, unidade)}, ${marcado ? 'marcado' : 'desmarcado'}`;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: 11, bottom: 11, left: 6, right: 6 }}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      accessibilityLabel={a11yLabel}
      accessibilityHint="Toque para marcar ou desmarcar este item"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Animated.View style={[styles.checkbox, boxAnimStyle]} importantForAccessibility="no">
        <Animated.View style={checkAnimStyle}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </Animated.View>

      <View style={styles.textWrap} importantForAccessibility="no">
        <Animated.Text style={[styles.nome, textAnimStyle]} numberOfLines={1}>
          {nome}
        </Animated.Text>
        <Animated.View style={[styles.strike, strikeStyle]} pointerEvents="none" />
      </View>

      <Animated.Text style={[styles.qtd, textAnimStyle]} importantForAccessibility="no">
        {formatQuantidade(quantidade, unidade)}
      </Animated.Text>
    </Pressable>
  );
}

export const ItemCompraLinha = memo(ItemCompraLinhaBase);

const CHECKBOX_SIZE = 22;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    minHeight: 48,
    gap: spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    height: 22,
  },
  nome: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  strike: {
    position: 'absolute',
    left: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: colors.textSecondary,
    transform: [{ translateY: -0.75 }],
  },
  qtd: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    minWidth: 56,
    textAlign: 'right',
  },
});
