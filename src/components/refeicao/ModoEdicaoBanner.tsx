import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';

export function ModoEdicaoBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        <Text style={styles.bold}>Modo Edição:</Text> Você pode adicionar, editar e remover alimentos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  text: { fontSize: 13, color: colors.primaryText, lineHeight: 18 },
  bold: { fontWeight: '700' },
});
