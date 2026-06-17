import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard, Platform } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';

import { colors, spacing } from '@/theme/colors';
import { SearchBar } from '@/components/ui/SearchBar';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { MacroChip } from '@/components/refeicao/MacroChip';
import { calcMacros } from '@/utils/macros';
import { matchTermo } from '@/utils/text';
import { hap } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (alimentoId: string) => void;
  /** IDs de alimentos já presentes no modelo — ficam fora da lista. */
  excludeIds?: string[];
}

export function PickerAlimentoSheet({ visible, onClose, onSelect, excludeIds }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const [busca, setBusca] = useState('');

  const ids = useAlimentosStore((s) => s.ids);
  const byId = useAlimentosStore((s) => s.byId);

  const excludeSet = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  const idsFiltrados = useMemo(() => {
    const base = ids.filter((id) => !excludeSet.has(id));
    if (!busca.trim()) return base;
    return base.filter((id) => {
      const a = byId[id];
      return a && (matchTermo(a.nome, busca) || matchTermo(a.categoria, busca));
    });
  }, [ids, byId, busca, excludeSet]);

  useEffect(() => {
    if (visible) {
      setBusca('');
      sheetRef.current?.expand();
      hap.tap();
    } else {
      sheetRef.current?.close();
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
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

  const handleSelect = (alimentoId: string) => {
    hap.add();
    onSelect(alimentoId);
  };

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['78%', '95%']}
      onClose={handleClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      index={0}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={renderBackdrop}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Adicionar Alimento</Text>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Fechar"
          >
            <X size={20} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar alimento..."
          />
        </View>

        <BottomSheetFlatList
          data={idsFiltrados}
          keyExtractor={(id) => id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          renderItem={({ item: id }) => {
            const a = byId[id];
            if (!a) return null;
            const m = calcMacros(a, 100);
            return (
              <Pressable
                onPress={() => handleSelect(id)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.itemNome} numberOfLines={1}>{a.nome}</Text>
                  <View style={styles.itemMacrosRow}>
                    <MacroChip label="P" valor={`${m.proteina}g`} cor={colors.macroProtein} />
                    <MacroChip label="C" valor={`${m.carbo}g`}    cor={colors.macroCarb} />
                    <MacroChip label="G" valor={`${m.gordura}g`}  cor={colors.macroFat} />
                  </View>
                </View>
                <View style={styles.unidBadge}>
                  <Text style={styles.unidText}>100{a.unidade}</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {busca ? 'Nenhum alimento encontrado' : 'Todos os alimentos já foram adicionados'}
              </Text>
            </View>
          }
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
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
  searchWrap: { paddingHorizontal: spacing.screenH, paddingBottom: spacing.sm },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemPressed: { opacity: 0.7, backgroundColor: colors.surfaceAlt },
  itemNome: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemMacrosRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  unidBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unidText: { fontSize: 12, fontWeight: '700', color: colors.primaryText },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
