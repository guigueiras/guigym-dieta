import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

interface Props {
  /** Total de steps (segmentos). */
  total: number;
  /** Step atual, 1-indexed. Segmentos de índice < current ficam preenchidos. */
  current: number;
}

/**
 * Barra de progresso segmentada do wizard.
 *
 * Visual: N barras finas lado a lado. As preenchidas (até `current`) ficam
 * na cor primária; as futuras ficam cinza. A transição de cor é animada
 * (280ms) quando o usuário avança/volta.
 *
 * Puramente visual — sem estado próprio. Padding lateral é responsabilidade
 * do container.
 */
export function WizardProgress({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Segment key={i} active={i < current} />
      ))}
    </View>
  );
}

interface SegmentProps {
  active: boolean;
}

function Segment({ active }: SegmentProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.quad),
    });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border, colors.primary]
    ),
  }));

  return <Animated.View style={[styles.segment, animatedStyle]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});