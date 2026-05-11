import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  interpolateColor, Easing,
} from 'react-native-reanimated';
import { CheckCircle2, RotateCcw } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';

interface Props {
  totalItens: number;
  totalMarcados: number;
  onDesmarcarTodos: () => void;
}

export function ContadorListaCompras({
  totalItens, totalMarcados, onDesmarcarTodos,
}: Props) {
  const completo = totalItens > 0 && totalMarcados === totalItens;
  const algumMarcado = totalMarcados > 0;

  const progress = useSharedValue(completo ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(completo ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [completo]);

  const wrapStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.18)']
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.successLight, colors.success]
    ),
  }));

  const iconScale = useSharedValue(1);
  useEffect(() => {
    if (completo) {
      hap.add();
      iconScale.value = withSpring(1.15, { damping: 8, stiffness: 220 }, () => {
        iconScale.value = withSpring(1, { damping: 14, stiffness: 240 });
      });
    }
  }, [completo]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  if (totalItens === 0) return null;

  return (
    <Animated.View style={[styles.wrap, wrapStyle]}>
      <View style={styles.left}>
        <Animated.View style={iconStyle}>
          <CheckCircle2
            size={16}
            color={completo ? colors.success : colors.successText}
            strokeWidth={2.4}
          />
        </Animated.View>

        <Text style={[styles.text, completo && styles.textCompleto]}>
          {completo
            ? 'Tudo comprado!'
            : `${totalMarcados} de ${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`}
        </Text>
      </View>

      {algumMarcado && (
        <Pressable
          onPress={() => { hap.tap(); onDesmarcarTodos(); }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Desmarcar todos os itens"
          style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}
        >
          <RotateCcw size={13} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.resetText}>Limpar</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    gap: spacing.md,
    minHeight: 32,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.successText,
    letterSpacing: -0.1,
  },
  textCompleto: {
    color: colors.success,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resetBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  resetText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
