import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Keyboard, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInRight, FadeOutRight } from 'react-native-reanimated';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { Save } from 'lucide-react-native';

import { colors, spacing } from '@/theme/colors';
import { HeaderDieta } from '@/components/ui/HeaderDieta';
import { DiasTabs } from '@/components/ui/DiasTabs';
import { ModoEdicaoBanner } from '@/components/refeicao/ModoEdicaoBanner';
import { RefeicaoCardEdit } from '@/components/refeicao/RefeicaoCardEdit';
import { AdicionarRefeicaoButton } from '@/components/refeicao/AdicionarRefeicaoButton';
import { TotalDiaFooterEdit } from '@/components/refeicao/TotalDiaFooterEdit';
import { AdicionarSheet } from '@/components/alimento/AdicionarSheet';
import { useModelosRefeicaoStore } from '@/stores/useModelosRefeicaoStore';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';

import { useDieta } from '@/stores/useDietasStore';
import {
  useEditDietaStore, useEditActions, useEditIsDirty,
  useEditSaving, useEditDiaAtivo, useEditRefeicoesDoDia,
} from '@/stores/useEditDietaStore';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useElementHeight } from '@/hooks/useElementHeight';
import { hap } from '@/utils/haptics';
import type { DiaSemana } from '@/types';
import type { Refeicao } from '@/types';

export default function DietaEditar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dieta = useDieta(id);

  const {
    iniciar, setDiaAtivo, descartar, salvar,
    addRefeicao, reorderRefeicoes, addAlimentoNaRefeicao,
  } = useEditActions();

  const diaAtivo = useEditDiaAtivo();
  const isDirty = useEditIsDirty();
  const saving = useEditSaving();
  const refeicoes = useEditRefeicoesDoDia(diaAtivo);

  const [sheet, setSheet] = useState<{ refeicaoId: string; initialTab: 0 | 1 } | null>(null);

  const handleSelectModelo = (modeloId: string) => {
    if (!sheet) return;
    const modelo = useModelosRefeicaoStore.getState().byId[modeloId];
    if (!modelo) { setSheet(null); return; }
    for (const ma of modelo.alimentos) {
      addAlimentoNaRefeicao(diaAtivo, sheet.refeicaoId, ma.alimentoId, 100);
    }
    hap.add();
    setSheet(null);
  };
  const [toastVisible, setToastVisible] = useState(false);
  const [highlightAlimentoId, setHighlightAlimentoId] = useState<string | null>(null);
  const [scrollToRefId, setScrollToRefId] = useState<string | null>(null);

  const listRef = useRef<any>(null);
  const { height: footerH, onLayout: onFooterLayout } = useElementHeight();
  const { height: bannerH, onLayout: onBannerLayout } = useElementHeight();

  useEffect(() => {
    if (dieta) iniciar(dieta);
    return () => descartar();
  }, [dieta?.id]);

  useUnsavedChangesGuard({
    isDirty,
    onConfirmExit: () => descartar(),
  });

  useEffect(() => {
    if (!scrollToRefId || !listRef.current) return;
    const idx = refeicoes.findIndex((r) => r.id === scrollToRefId);
    if (idx >= 0) {
      InteractionManager.runAfterInteractions(() => {
        try {
          listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
        } catch {}
      });
    }
    setScrollToRefId(null);
  }, [scrollToRefId, refeicoes]);

  const handleChangeDia = (d: DiaSemana) => {
    hap.select();
    setDiaAtivo(d);
  };

  const handleAddRefeicao = () => {
    hap.add();
    addRefeicao(diaAtivo);
  };

  const handleAdicionarAlimento = (refeicaoId: string) => {
    Keyboard.dismiss();
    hap.tap();
    setSheet({ refeicaoId, initialTab: 0 });
  };

  const handleConfirmarAlimento = useCallback(
    (refeicaoId: string, alimentoId: string, quantidade: number) => {
      const novoId = addAlimentoNaRefeicao(diaAtivo, refeicaoId, alimentoId, quantidade);
      setHighlightAlimentoId(novoId);
      hap.add();

      setTimeout(() => setSheet(null), 80);
      setTimeout(() => setScrollToRefId(refeicaoId), 320);
      setTimeout(() => setHighlightAlimentoId(null), 1000);
    },
    [diaAtivo, addAlimentoNaRefeicao]
  );

  const handleDragEnd = ({ data }: { data: Refeicao[] }) => {
    hap.tap();
    reorderRefeicoes(diaAtivo, data.map((r) => r.id));
  };

  const handleSalvar = async () => {
    if (!isDirty || saving) return;
    Keyboard.dismiss();
    try {
      await salvar();
      hap.add();
      setToastVisible(true);
      setTimeout(() => router.back(), 850);
    } catch {
      hap.error();
    }
  };

  if (!dieta || !id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <HeaderDieta titulo="Dieta não encontrada" onBack={() => router.back()} />
        <EmptyState title="Esta dieta não existe ou foi removida" />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Refeicao>) => (
    <View style={{ paddingVertical: spacing.sm }}>
      <RefeicaoCardEdit
        dia={diaAtivo}
        refeicaoId={item.id}
        isDragging={isActive}
        onLongPressDrag={drag}
        onAdicionarAlimento={() => handleAdicionarAlimento(item.id)}
        highlightAlimentoId={highlightAlimentoId}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HeaderDieta
        titulo={dieta.nome}
        onBack={() => router.back()}
        banner={<View onLayout={onBannerLayout}><ModoEdicaoBanner /></View>}
      />

      <DiasTabs valor={diaAtivo} onChange={handleChangeDia} />

      <View style={styles.listWrap}>
        <DraggableFlatList
          ref={listRef}
          data={refeicoes}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          onDragBegin={() => hap.tap()}
          onPlaceholderIndexChange={() => hap.select()}
          onDragEnd={handleDragEnd}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: footerH + spacing.xxl + 60 },
          ]}
          ListEmptyComponent={
            <EmptyState
              title="Nenhuma refeição neste dia"
              subtitle='Toque em "Adicionar refeição" abaixo'
            />
          }
          ListFooterComponent={
            <View style={{ paddingTop: spacing.md }}>
              <AdicionarRefeicaoButton onPress={handleAddRefeicao} />
            </View>
          }
          showsVerticalScrollIndicator={false}
          activationDistance={12}
        />
      </View>

      {(isDirty || saving) && (
        <Animated.View
          entering={FadeInRight.duration(220)}
          exiting={FadeOutRight.duration(160)}
          style={[styles.salvarFab, { bottom: footerH + spacing.md }]}
        >
          <Button
            variant="success"
            loading={saving}
            onPress={handleSalvar}
            icon={<Save size={18} color="#FFFFFF" strokeWidth={2.4} />}
            fullWidth={false}
          >
            Salvar
          </Button>
        </Animated.View>
      )}

      <View style={styles.footerWrap} onLayout={onFooterLayout}>
        <TotalDiaFooterEdit dia={diaAtivo} />
      </View>

      <AdicionarSheet
        visible={!!sheet}
        refeicaoId={sheet?.refeicaoId}
        dia={diaAtivo}
        initialTab={sheet?.initialTab}
        onConfirmar={handleConfirmarAlimento}
        onSelectModelo={handleSelectModelo}
        onClose={() => setSheet(null)}
      />

      <Toast
        visible={toastVisible}
        mensagem="Salvo com sucesso"
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  listWrap: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    flexGrow: 1,
  },
  salvarFab: {
    position: 'absolute',
    right: spacing.screenH,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
