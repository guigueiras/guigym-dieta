import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, ShoppingCart } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { HeaderDieta } from '@/components/ui/HeaderDieta';
import { DiasTabs } from '@/components/ui/DiasTabs';
import { RefeicaoCardView } from '@/components/refeicao/RefeicaoCardView';
import { TotalDiaFooter } from '@/components/refeicao/TotalDiaFooter';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDieta } from '@/stores/useDietasStore';
import { useElementHeight } from '@/hooks/useElementHeight';
import { hap } from '@/utils/haptics';
import type { DiaSemana } from '@/types';
import { useShallow } from 'zustand/react/shallow';
import { useDietasStore } from '@/stores/useDietasStore';

export default function DietaVisualizar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dieta = useDieta(id);
  const [diaAtivo, setDiaAtivo] = useState<DiaSemana>('segunda');

  const refeicaoIds = useDietasStore(
    useShallow((s) => {
      const dia = s.byId[id ?? '']?.dias.find((d) => d.nome === diaAtivo);
      return dia?.refeicoes.slice().sort((a, b) => a.ordem - b.ordem).map((r) => r.id) ?? [];
    })
  );

  const { height: footerH, onLayout: onFooterLayout } = useElementHeight();

  if (!dieta || !id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <HeaderDieta titulo="Dieta não encontrada" onBack={() => router.back()} />
        <EmptyState title="Esta dieta não existe ou foi removida" />
      </SafeAreaView>
    );
  }

  const handleEditar = () => {
    hap.tap();
    router.push(`/dieta/${id}/editar` as any);
  };

  const handleListaCompras = () => {
    hap.tap();
    router.push(`/lista-compras/${id}` as any);
  };

  const handleChangeDia = (d: DiaSemana) => {
    hap.select();
    setDiaAtivo(d);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HeaderDieta
        titulo={dieta.nome}
        onBack={() => router.back()}
        actions={
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleEditar}
              hitSlop={10}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
              accessibilityLabel="Editar dieta"
            >
              <Pencil size={18} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={handleListaCompras}
              hitSlop={10}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
              accessibilityLabel="Lista de compras"
            >
              <ShoppingCart size={18} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
          </View>
        }
      />

      <DiasTabs valor={diaAtivo} onChange={handleChangeDia} />

      <FlatList
        data={refeicaoIds}
        keyExtractor={(rId) => rId}
        renderItem={({ item }) => (
          <RefeicaoCardView dietaId={id} dia={diaAtivo} refeicaoId={item} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: footerH + spacing.md },
        ]}
        ListEmptyComponent={
          <EmptyState
            title="Nenhuma refeição cadastrada"
            subtitle='Toque no ícone de lápis para editar este dia'
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footerWrap} onLayout={onFooterLayout}>
        <TotalDiaFooter dietaId={id} dia={diaAtivo} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  actionsRow: { flexDirection: 'row', gap: 4 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  headerBtnPressed: { opacity: 0.7 },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    flexGrow: 1,
  },
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
