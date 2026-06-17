import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard, Platform } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/colors';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { SheetTabs } from '@/components/ui/SheetTabs';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { useModelosIds, useModelosRefeicaoStore } from '@/stores/useModelosRefeicaoStore';
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
  initialTab?: 0 | 1;
  onConfirmar: (refeicaoId: string, alimentoId: string, quantidade: number) => void;
  onSelectModelo: (modeloId: string) => void;
}

type Page = 'lista' | 'detalhe';

const TABS = ['Alimentos', 'Refeições'];
const QTD_INICIAL = 100;

export function AdicionarSheet({
  visible, onClose, refeicaoId, dia, initialTab, onConfirmar, onSelectModelo,
}: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState<Page>('lista');
  const [selecionado, setSelecionado] = useState<Alimento | null>(null);
  const [quantidade, setQuantidade] = useState<number>(QTD_INICIAL);

  const alimentoIds = useAlimentosStore((s) => s.ids);
  const alimentoById = useAlimentosStore((s) => s.byId);
  const modeloIds = useModelosIds();
  const modeloById = useModelosRefeicaoStore((s) => s.byId);

  const alimentoIdsFiltrados = useMemo(() => {
    if (!busca.trim()) return alimentoIds;
    return alimentoIds.filter((id) => alimentoById[id] && (
      matchTermo(alimentoById[id].nome, busca) || matchTermo(alimentoById[id].categoria, busca)
    ));
  }, [alimentoIds, alimentoById, busca]);

  const modeloIdsFiltrados = useMemo(() => {
    if (!busca.trim()) return modeloIds;
    return modeloIds.filter((id) => modeloById[id] && matchTermo(modeloById[id].nome, busca));
  }, [modeloIds, modeloById, busca]);

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
      setActiveTab(initialTab ?? 0);
      slide.value = 0;
      setPage('lista');
      setBusca('');
      setQuantidade(QTD_INICIAL);
      setSelecionado(null);
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

  const handleSheetClosed = useCallback(() => {
    setSelecionado(null);
  }, []);

  const handleTabChange = (index: number) => {
    hap.select();
    slide.value = 0;
    setPage('lista');
    setBusca('');
    setSelecionado(null);
    setActiveTab(index as 0 | 1);
  };

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
    const a = alimentoById[id];
    if (!a) return;
    Keyboard.dismiss();
    hap.select();
    setSelecionado(a);
    setQuantidade(QTD_INICIAL);
    setPage('detalhe');
  };

  const voltarParaLista = () => {
    Keyboard.dismiss();
    hap.tap();
    setPage('lista');
  };

  const confirmarAdicao = useCallback(() => {
    if (!selecionado || !refeicaoId || quantidade <= 0) {
      hap.error();
      return;
    }
    onConfirmar(refeicaoId, selecionado.id, quantidade);
  }, [selecionado, refeicaoId, quantidade, onConfirmar]);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        {activeTab === 0 && page === 'detalhe' && selecionado ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(160)}
            style={styles.footer}
          >
            <Button
              variant="primary"
              onPress={confirmarAdicao}
              disabled={quantidade <= 0}
            >
              Adicionar
            </Button>
          </Animated.View>
        ) : null}
      </BottomSheetFooter>
    ),
    [activeTab, page, selecionado, quantidade, insets.bottom, confirmarAdicao]
  );

  if (!visible && !selecionado) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['78%', '95%']}
      onClose={handleClose}
      onAnimate={(_from, to) => {
        if (to === -1) handleSheetClosed();
      }}
      enablePanDownToClose
      enableDynamicSizing={false}
      keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      index={visible ? 0 : -1}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Adicionar</Text>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel="Fechar"
          >
            <X size={20} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        <SheetTabs tabs={TABS} activeIndex={activeTab} onChange={handleTabChange} />

        <View style={styles.tabContent}>
          {activeTab === 0 && (
            <>
              <Animated.View
                style={[StyleSheet.absoluteFill, listaStyle]}
                pointerEvents={page === 'lista' ? 'auto' : 'none'}
              >
                <View style={styles.searchWrap}>
                  <SearchBar
                    value={busca}
                    onChangeText={setBusca}
                    placeholder="Buscar alimento..."
                  />
                </View>
                <BottomSheetFlatList
                  data={alimentoIdsFiltrados}
                  keyExtractor={(id) => id}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                  renderItem={({ item: id }) => {
                    const a = alimentoById[id];
                    if (!a) return null;
                    const m = calcMacros(a, 100);
                    return (
                      <Pressable
                        onPress={() => irParaDetalhe(id)}
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
                  initialNumToRender={12}
                  maxToRenderPerBatch={10}
                  windowSize={7}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              </Animated.View>

              <Animated.View
                style={[StyleSheet.absoluteFill, detalheStyle]}
                pointerEvents={page === 'detalhe' ? 'auto' : 'none'}
              >
                {selecionado && (
                  <DetalheAlimentoQuantidade
                    alimento={selecionado}
                    quantidade={quantidade}
                    onChangeQuantidade={setQuantidade}
                    visible={page === 'detalhe'}
                    onVoltar={voltarParaLista}
                  />
                )}
              </Animated.View>
            </>
          )}

          {activeTab === 1 && (
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.searchWrap}>
                <SearchBar
                  value={busca}
                  onChangeText={setBusca}
                  placeholder="Buscar modelo..."
                />
              </View>
              <BottomSheetFlatList
                data={modeloIdsFiltrados}
                keyExtractor={(id) => id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                renderItem={({ item: id }) => {
                  const m = modeloById[id];
                  if (!m) return null;
                  const count = m.alimentos.length;
                  return (
                    <Pressable
                      onPress={() => { hap.select(); onSelectModelo(id); }}
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
                    <Text style={styles.emptyTitle}>
                      {busca ? 'Nenhum modelo encontrado' : 'Nenhum modelo cadastrado'}
                    </Text>
                    <Text style={styles.emptySub}>
                      {busca
                        ? 'Tente outra busca'
                        : 'Crie modelos na aba "Refeições" para reutilizá-los aqui.'}
                    </Text>
                  </View>
                }
                initialNumToRender={12}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
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
  handle: {
    backgroundColor: colors.border,
    width: 40,
    height: 4,
  },
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

  tabContent: { flex: 1, position: 'relative' },

  searchWrap: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemPressed: { opacity: 0.7, backgroundColor: colors.surfaceAlt },
  itemNome: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemMacrosRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  itemCount: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  qtdBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  qtdBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryText },
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

  footer: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
});
