import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import type { ReactNode } from 'react';
import { hap } from '@/utils/haptics';

interface Props {
  titulo: string;
  onBack: () => void;
  actions?: ReactNode;
  banner?: ReactNode;
}

export function HeaderDieta({ titulo, onBack, actions, banner }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.navRow}>
        <Pressable
          onPress={() => { hap.tap(); onBack(); }}
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2.6} />
        </Pressable>

        {!!titulo && (
          <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
        )}

        {actions
          ? <View style={styles.actions}>{actions}</View>
          : <View style={styles.actionPlaceholder} />}
      </View>

      {banner}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: { opacity: 0.6 },
  titulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row' },
  actionPlaceholder: { width: 40 },
});
