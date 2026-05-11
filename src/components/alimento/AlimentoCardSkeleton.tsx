import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, spacing } from '@/theme/colors';

export function AlimentoCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={{ gap: 6 }}>
        <Skeleton width="55%" height={16} radius={5} />
        <Skeleton width="30%" height={12} radius={4} />
      </View>
      <Skeleton width={64} height={20} radius={6} />
      <View style={styles.macros}>
        <Skeleton width="30%" height={32} radius={8} />
        <Skeleton width="30%" height={32} radius={8} />
        <Skeleton width="30%" height={32} radius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg - 2,
    gap: spacing.sm + 4,
    marginBottom: spacing.cardGap,
  },
  macros: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-around' },
});
