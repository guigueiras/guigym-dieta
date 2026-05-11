import { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { TIPOS_DIETA } from '@/constants';
import type { TipoDieta } from '@/types';
import { hap } from '@/utils/haptics';

interface Props {
  value: TipoDieta;
  onChange: (v: TipoDieta) => void;
}

export function TipoDietaSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const select = (v: TipoDieta) => {
    hap.select();
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.value}>{value}</Text>
        <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.list}>
            <FlatList
              data={TIPOS_DIETA as readonly TipoDieta[]}
              keyExtractor={(t) => t}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => {
                const sel = item === value;
                return (
                  <Pressable
                    onPress={() => select(item)}
                    style={({ pressed }) => [
                      styles.item,
                      sel && styles.selected,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <Text style={[styles.itemText, sel && styles.selectedText]}>{item}</Text>
                    {sel && <Check size={18} color={colors.primary} strokeWidth={2.5} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  pressed: { opacity: 0.7 },
  value: { fontSize: 16, color: colors.text },
  backdrop: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  list: {
    width: '100%', maxWidth: 320,
    backgroundColor: '#FFFFFF', borderRadius: radii.md,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, height: 48,
  },
  selected: { backgroundColor: colors.primaryLight },
  itemPressed: { backgroundColor: colors.surfaceAlt },
  itemText: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.primaryText, fontWeight: '600' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
