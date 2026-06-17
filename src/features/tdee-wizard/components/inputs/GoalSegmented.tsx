import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, radii, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';
import type { Goal } from '@/utils/tdee';

interface Props {
  value: Goal;
  onChange: (goal: Goal) => void;
}

interface Opcao {
  goal: Goal;
  label: string;
}

const OPCOES: readonly Opcao[] = [
  { goal: 'cutting',     label: 'Cutting' },
  { goal: 'maintenance', label: 'Manutenção' },
  { goal: 'bulking',     label: 'Bulking' },
];

/**
 * Segmented control horizontal pra escolha de objetivo no Step 4.
 *
 * Visual: container cinza claro, segmento ativo vira branco com sombra leve.
 * Padrão iOS segmented control.
 */
export function GoalSegmented({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPCOES.map((op) => (
        <GoalSegment
          key={op.goal}
          label={op.label}
          ativo={value === op.goal}
          onPress={() => {
            if (value === op.goal) return;
            hap.select();
            onChange(op.goal);
          }}
        />
      ))}
    </View>
  );
}

interface SegmentProps {
  label: string;
  ativo: boolean;
  onPress: () => void;
}

function GoalSegment({ label, ativo, onPress }: SegmentProps) {
  const progress = useSharedValue(ativo ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(ativo ? 1 : 0, { duration: 200 });
  }, [ativo]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0)', '#FFFFFF']
    ),
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.segmentSlot}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.segment, animatedStyle, ativo && styles.segmentAtivo]}>
        <Text style={[styles.label, ativo && styles.labelAtivo]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    gap: 2,
  },
  segmentSlot: { flex: 1 },
  segment: {
    height: 36,
    borderRadius: radii.md - 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentAtivo: {
    // Sombra sutil quando ativo (iOS look)
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelAtivo: {
    color: colors.text,
  },
});