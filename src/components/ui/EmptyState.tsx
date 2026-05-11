import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.xxxl * 2, alignItems: 'center', gap: 4 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
