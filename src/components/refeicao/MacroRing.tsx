import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** Percentual de progresso (0–N). Acima de 100 = excesso (cor muda). */
  percent: number;
  /** Tamanho total do anel em pt. Default 42. */
  size?: number;
  /** Espessura do traço em pt. Default 6. */
  strokeWidth?: number;
}

// Faixas semafóricas
const RED_LOW = 50;       // < 50%    → vermelho
const GREEN_LOW = 97;     // 50–96%   → amarelo
const GREEN_HIGH = 103;   // 97–103%  → verde
const RED_HIGH = 115;     // 104–115% → amarelo, > 115% → vermelho

/**
 * Anel circular de progresso com % central e cores semafóricas.
 *
 * Cores (dependem do valor do `percent`):
 *  - < 50%   → vermelho (muito abaixo do alvo)
 *  - 50–84%  → amarelo  (longe ainda, progredindo)
 *  - 85–115% → verde    (perto ou dentro do alvo)
 *  - > 115%  → vermelho (excedeu)
 *
 * Display do %: número arredondado dentro do anel. Excessos mostram
 * o valor real (ex: 145%), não clampado. Arco visual fica em 100% pra
 * não distorcer a geometria.
 *
 * Animação: 320ms quando `percent` muda.
 *
 * Fix de travamento: shared value inicializa em "arco vazio" (não calculado
 * do percent inicial) — só o useEffect comanda animações. Evita conflito
 * de inicialização + animação simultâneas em remontagens rápidas no Fabric.
 */
export function MacroRing({ percent, size = 42, strokeWidth = 5 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Estado de cor semafórico
  const strokeColor = colorForPercent(percent);

  // Clamp visual: arco para de girar em 100% (excesso é comunicado pela cor)
  const displayPercent = Math.max(0, Math.min(100, percent));

  // ⚠️ inicia em "vazio" (offset = circumference). Só o useEffect anima.
  // Isso evita conflito init+anim em remontagens rápidas.
  const offset = useSharedValue(circumference);

  useEffect(() => {
    offset.value = withTiming(circumference * (1 - displayPercent / 100), {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [displayPercent, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  // Texto do % — número arredondado, max 3 dígitos defensivo
  const pctText = formatPercent(percent);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Roda -90° pra começar no topo (12h)
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progresso */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      {/* % central */}
      <View style={styles.label} pointerEvents="none">
        <Text style={[styles.text, { color: strokeColor }]} numberOfLines={1}>
          {pctText}
        </Text>
      </View>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function colorForPercent(percent: number): string {
  if (!Number.isFinite(percent) || percent < 0) return colors.danger;
  if (percent < RED_LOW) return colors.danger;
  if (percent > RED_HIGH) return colors.danger;
  if (percent >= GREEN_LOW && percent <= GREEN_HIGH) return colors.successText;
  return colors.warning;
}

function formatPercent(percent: number): string {
  if (!Number.isFinite(percent) || percent < 0) return '0%';
  const rounded = Math.round(percent);
  if (rounded > 999) return '999%+';
  return `${rounded}%`;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 14,
  },
});
