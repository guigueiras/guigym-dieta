import { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { colors, spacing, radii } from '@/theme/colors';
import { useModelosIds, useModelosRefeicaoStore } from '@/stores/useModelosRefeicaoStore';
import { hap } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (modeloId: string) => void;
}

export function PickerModeloSheet({ visible, onClose, onSelect }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const ids = useModelosIds();
  const byId = useModelosRefeicaoStore((s) => s.byId);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
      hap.tap();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSelect = (modeloId: string) => {
    hap.select();
    onSelect(modeloId);
  };

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['55%', '80%']}
      onClose={handleClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      index={visible ? 0 : -1}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={renderBackdrop}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Usar modelo</Text>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Fechar"
          >
            <X size={20} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        <BottomSheetFlatList
          data={ids}
          keyExtractor={(id) => id}
          renderItem={({ item: id }) => {
            const m = byId[id];
            if (!m) return null;
            const count = m.alimentos.length;
            return (
              <Pressable
                onPress={() => handleSelect(id)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <Text style={styles.itemNome} numberOfLines={1}>{m.nome}</Text>
                <Text style={styles.itemCount}>
                  {count === 1 ? '1 alimento' : `${count} alimentos`}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhum modelo cadastrado</Text>
              <Text style={styles.emptySub}>
                Crie modelos na aba "Refeições" para reutilizá-los aqui.
              </Text>
            </View>
          }
          initialNumToRender={12}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: { backgroundColor: colors.border, width: 40, height: 4 },
  content: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 4,
  },
  itemPressed: { opacity: 0.7, backgroundColor: colors.surfaceAlt },
  itemNome: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemCount: { fontSize: 13, color: colors.textSecondary },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
