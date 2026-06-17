import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';
import type { ActivityLevel } from '@/utils/tdee';

interface Props {
  value: ActivityLevel | null;
  onChange: (level: ActivityLevel) => void;
}

interface Opcao {
  level: ActivityLevel;
  title: string;
  desc: string;
}

const OPCOES: readonly Opcao[] = [
  { level: 'sedentary', title: 'Sedentário',    desc: 'Pouco ou nenhum exercício' },
  { level: 'light',     title: 'Leve',          desc: '1–3x por semana' },
  { level: 'moderate',  title: 'Moderado',      desc: '3–5x por semana' },
  { level: 'high',      title: 'Intenso',       desc: '6–7x por semana' },
  { level: 'very_high', title: 'Muito intenso', desc: '2x/dia ou trabalho físico' },
];

/**
 * Seleção de nível de atividade. 5 cards empilhados, seleção única.
 * Sem default — value=null deixa todos inativos.
 *
 * Visual: card ativo recebe borda azul + fundo levemente azulado (primaryLight).
 * Não usa azul saturado pra preservar legibilidade da descrição.
 */
export function AtividadeSelect({ value, onChange }: Props) {
  return (
    <View style={styles.list}>
      {OPCOES.map((op) => (
        <AtividadeCard
          key={op.level}
          title={op.title}
          desc={op.desc}
          ativo={value === op.level}
          onPress={() => {
            hap.select();
            onChange(op.level);
          }}
        />
      ))}
    </View>
  );
}

interface CardProps {
  title: string;
  desc: string;
  ativo: boolean;
  onPress: () => void;
}

function AtividadeCard({ title, desc, ativo, onPress }: CardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.98, { duration: 90 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 240 }); }}
      accessibilityRole="radio"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={`${title}, ${desc}`}
    >
      <Animated.View style={[styles.card, ativo && styles.cardAtivo, animStyle]}>
        <Text style={[styles.title, ativo && styles.titleAtivo]}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    gap: 2,
  },
  cardAtivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  titleAtivo: {
    color: colors.primaryText,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});