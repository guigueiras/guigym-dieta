import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';

interface Props { onPress: () => void; }

export function AdicionarRefeicaoButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <Plus size={18} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={styles.text}>Adicionar refeição</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.md + 2,
    backgroundColor: 'transparent',
    marginTop: spacing.xs,
  },
  pressed: { backgroundColor: colors.surface, opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  text: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});
