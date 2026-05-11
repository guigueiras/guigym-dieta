import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Keyboard, Platform } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import { SearchBar } from '@/components/ui/SearchBar';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { matchTermo } from '@/utils/text';
import { hap } from '@/utils/haptics';
import { calcMacros } from '@/utils/macros';
import { MacroChip } from '@/components/refeicao/MacroChip';
import { DetalheAlimentoQuantidade } from './DetalheAlimentoQuantidade';
import type { DiaSemana, Alimento } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  refeicaoId?: string;
  dia: DiaSemana;
  onConfirmar: (refeicaoId: string, alimentoId: string, quantidade: number) => void;
}

type Page = 'lista' | 'detalhe';

export function AdicionarAlimentoSheet({
  visible, onClose, refeicaoId, dia, onConfirmar,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);

  const [busca, setBusca] = useState('');
  const [page, setPage] = useState<Page>('lista');
  const [selecionado, setSelecionado] = useState<Alimento | null>(null);

  const ids = useAlimentosStore((s) => s.ids);
  const byId = useAlimentosStore((s) => s.byId);

  const idsFiltrados = useMemo(() => {
    if (!busca.trim()) return ids;
    return ids.filter((id) => byId[id] && (
      matchTermo(byId[id].nome, busca) || matchTermo(byId[id].categoria, busca)
    ));
  }, [ids, byId, busca]);

  const slide = useSharedValue(0);
  useEffect(() => {
    slide.value = withTiming(page === 'lista' ? 0 : 1, {
      duration: 280, easing: Easing.out(Easing.cubic),
    });
  }, [page]);

  const listaStyle = useAnimatedStyle(() => ({
    opacity: 1 - slide.value,
    transform: [{ translateX: -slide.value * 80 }],
  }));
  const detalheStyle = useAnimatedStyle(() => ({
    opacity: slide.value,
    transform: [{ translateX: (1 - slide.value) * 80 }],
  }));

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
      hap.tap();
    } else {
      sheetRef.current?.close();
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setBusca('');
    setPage('lista');
    setTimeout(() => setSelecionado(null), 280);
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

  const irParaDetalhe = (id: string) => {
    const a = byId[id];
    if (!a) return;
    Keyboard.dismiss();
    hap.select();
    setSelecionado(a);
    setPage('detalhe');
  };

  const voltarParaLista = () => {
    Keyboard.dismiss();
    hap.tap();
    setPage('lista');
  };

  const confirmarAdicao = (quantidade: number) => {
    if (!selecionado || !refeicaoId) return;
    onConfirmar(refeicaoId, selecionado.id, quantidade);
  };

  if (!visible && !selecionado) return null;

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
      index={visible ? 0 : -1}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.content}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.page, listaStyle]}
          pointerEvents={page === 'lista' ? 'auto' : 'none'}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Adicionar Alimento</Text>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar alimento..." />

          <FlatList
            data={idsFiltrados}
            keyExtractor={(id) => id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: id }) => {
              const a = byId[id];
              if (!a) return null;
              const m = calcMacros(a, 100);
              return (
                <Pressable
                  onPress={() => irParaDetalhe(id)}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.itemNome}>{a.nome}</Text>
                    <View style={styles.itemMacrosRow}>
                      <MacroChip label="P" valor={`${m.proteina}g`} cor={colors.macroProtein} />
                      <MacroChip label="C" valor={`${m.carbo}g`}    cor={colors.macroCarb} />
                      <MacroChip label="G" valor={`${m.gordura}g`}  cor={colors.macroFat} />
                    </View>
                  </View>
                  <View style={styles.qtdBadge}>
                    <Text style={styles.qtdBadgeText}>100{a.unidade}</Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>
                  {busca ? 'Nenhum alimento encontrado' : 'Nenhum alimento cadastrado'}
                </Text>
                <Text style={styles.emptySub}>
                  {busca
                    ? 'Tente outra busca ou crie um novo na aba "Alimentos"'
                    : 'Vá até a aba "Alimentos" para adicionar'}
                </Text>
              </View>
            }
            removeClippedSubviews
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            contentContainerStyle={{
              paddingTop: spacing.md,
              paddingBottom: spacing.xxxl,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>

        <Animated.View
          style={[StyleSheet.absoluteFill, styles.page, detalheStyle]}
          pointerEvents={page === 'detalhe' ? 'auto' : 'none'}
        >
          {selecionado && (
            <DetalheAlimentoQuantidade
              alimento={selecionado}
              visible={page === 'detalhe'}
              onVoltar={voltarParaLista}
              onConfirmar={confirmarAdicao}
            />
          )}
        </Animated.View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: {
    backgroundColor: colors.border,
    width: 40,
    height: 4,
  },
  content: { flex: 1, position: 'relative' },
  page: {
    paddingHorizontal: spacing.screenH,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
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
  qtdBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtdBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryText },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
