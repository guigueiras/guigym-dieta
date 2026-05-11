import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';

export function EmptyRefeicao() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Nenhum alimento adicionado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.lg, alignItems: 'center' },
  text: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
});
