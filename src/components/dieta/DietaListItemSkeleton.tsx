import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, spacing } from '@/theme/colors';

export function DietaListItemSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Skeleton width="55%" height={17} radius={5} />
        <Skeleton width="35%" height={13} radius={4} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={20} height={20} radius={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.cardPadH,
    paddingVertical: spacing.cardPadV + 2,
    minHeight: 72,
    gap: spacing.md,
    marginBottom: spacing.cardGap,
  },
  info: { flex: 1 },
});
