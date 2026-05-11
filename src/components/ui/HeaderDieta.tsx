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
      <Pressable
        onPress={() => { hap.tap(); onBack(); }}
        hitSlop={12}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
      >
        <ChevronLeft size={20} color={colors.primary} strokeWidth={2.4} />
        <Text style={styles.backText}>Voltar</Text>
      </Pressable>

      {!!titulo && (
        <View style={styles.row}>
          <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      )}

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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 4,
    paddingRight: 8,
    marginLeft: -4,
  },
  backBtnPressed: { opacity: 0.5 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titulo: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  actions: { flexDirection: 'row' },
});
