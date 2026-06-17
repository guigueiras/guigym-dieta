import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, radii, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';
import type { CarbProfile } from '@/utils/tdee';

interface Props {
  value: CarbProfile;
  onChange: (profile: CarbProfile) => void;
}

interface Opcao {
  profile: CarbProfile;
  label: string;
}

const OPCOES: readonly Opcao[] = [
  { profile: 'low_carb',    label: 'Low' },
  { profile: 'medium_carb', label: 'Medium' },
  { profile: 'high_carb',   label: 'High' },
];

/**
 * Segmented control horizontal pra escolha do perfil de carboidrato no Step 4.
 *
 * Mesma estética do GoalSegmented. Componente separado em vez de genérico
 * pra evitar abstração precoce — apenas 2 usos da forma, não compensa.
 */
export function CarbProfileSegmented({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPCOES.map((op) => (
        <CarbSegment
          key={op.profile}
          label={op.label}
          ativo={value === op.profile}
          onPress={() => {
            if (value === op.profile) return;
            hap.select();
            onChange(op.profile);
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

function CarbSegment({ label, ativo, onPress }: SegmentProps) {
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