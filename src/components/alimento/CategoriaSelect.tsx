import { useState } from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet, FlatList,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { useCategorias } from '@/hooks/useCategorias';
import { CATEGORIA_BY_ID, type CategoriaId, type Categoria } from '@/constants/categorias';
import { hap } from '@/utils/haptics';

interface Props {
  value: CategoriaId;
  onChange: (v: CategoriaId) => void;
}

export function CategoriaSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const categorias = useCategorias();
  const atual = CATEGORIA_BY_ID[value];
  const AtualIcon = atual.icon;

  const select = (v: CategoriaId) => {
    hap.select();
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Categoria selecionada: ${atual.label}. Toque para alterar`}
      >
        <View style={styles.triggerContent}>
          <AtualIcon size={16} color={atual.color} strokeWidth={2.4} />
          <Text style={styles.value}>{atual.label}</Text>
        </View>
        <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.list}>
            <FlatList
              data={categorias as readonly Categoria[]}
              keyExtractor={(c) => c.id}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => {
                const sel = item.id === value;
                const Icon = item.icon;
                return (
                  <Pressable
                    onPress={() => select(item.id)}
                    style={({ pressed }) => [
                      styles.item,
                      sel && styles.selected,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <View style={styles.itemRow}>
                      <Icon size={16} color={item.color} strokeWidth={2.4} />
                      <Text style={[styles.itemText, sel && styles.selectedText]}>{item.label}</Text>
                    </View>
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
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  pressed: { opacity: 0.7 },
  triggerContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, flex: 1 },
  value: { fontSize: 16, color: colors.text, fontWeight: '500' },
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
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  selected: { backgroundColor: colors.primaryLight },
  itemPressed: { backgroundColor: colors.surfaceAlt },
  itemText: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.primaryText, fontWeight: '600' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
