import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';
import type { Sex } from '@/utils/tdee';

interface Props {
  value: Sex | null;
  onChange: (sex: Sex) => void;
}

const OPCOES: Array<{ sex: Sex; label: string }> = [
  { sex: 'male', label: 'Homem' },
  { sex: 'female', label: 'Mulher' },
];

/**
 * Seleção de sexo. Dois cards lado a lado, seleção única.
 * Sem default — `value: null` deixa ambos inativos até o usuário escolher.
 *
 * Controlado: não conhece o store. O Step1 conecta via onChange.
 */
export function SexoToggle({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPCOES.map((op) => (
        <SexoCard
          key={op.sex}
          label={op.label}
          ativo={value === op.sex}
          onPress={() => {
            hap.select();
            onChange(op.sex);
          }}
        />
      ))}
    </View>
  );
}

interface CardProps {
  label: string;
  ativo: boolean;
  onPress: () => void;
}

function SexoCard({ label, ativo, onPress }: CardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 90 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 240 }); }}
      style={styles.cardSlot}
      accessibilityRole="radio"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.card, ativo && styles.cardAtivo, animStyle]}>
        <Text style={[styles.label, ativo && styles.labelAtivo]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardSlot: { flex: 1 },
  card: {
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  labelAtivo: {
    color: '#FFFFFF',
  },
});