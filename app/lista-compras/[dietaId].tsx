import { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShoppingCart, Share2 } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { HeaderDieta } from '@/components/ui/HeaderDieta';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GrupoCategoriaCard } from '@/components/lista-compras/GrupoCategoriaCard';
import { ContadorListaCompras } from '@/components/lista-compras/ContadorListaCompras';
import { useDieta } from '@/stores/useDietasStore';
import { useListaCompras } from '@/hooks/useListaCompras';
import {
  useMarcadosDaDieta, useListaActions,
} from '@/stores/useListaComprasUIStore';
import { useElementHeight } from '@/hooks/useElementHeight';
import { shareTexto } from '@/services/share';
import { listaComprasParaTexto } from '@/utils/listaCompras';
import { hap } from '@/utils/haptics';

export default function ListaComprasScreen() {
  const { dietaId } = useLocalSearchParams<{ dietaId: string }>();
  const router = useRouter();
  const dieta = useDieta(dietaId);
  const grupos = useListaCompras(dietaId ?? '');

  const marcados = useMarcadosDaDieta(dietaId ?? '');
  const { desmarcarTodos } = useListaActions();

  const totalItens = useMemo(
    () => grupos.reduce((s, g) => s + g.itens.length, 0),
    [grupos]
  );

  const { height: footerH, onLayout: onFooterLayout } = useElementHeight();

  if (!dieta || !dietaId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <HeaderDieta titulo="" onBack={() => router.back()} />
        <EmptyState title="Dieta não encontrada" />
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    if (grupos.length === 0) return;
    hap.tap();
    const texto = listaComprasParaTexto(dieta.nome, grupos);
    try {
      await shareTexto(`Lista de Compras — ${dieta.nome}`, texto);
    } catch {
      hap.error();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HeaderDieta titulo="" onBack={() => router.back()} />

      <View style={styles.tituloBlock}>
        <View style={styles.tituloRow}>
          <View style={styles.iconCircle}>
            <ShoppingCart size={20} color={colors.success} strokeWidth={2.4} />
          </View>
          <Text style={styles.titulo}>Lista de Compras</Text>
        </View>
        <Text style={styles.subtitulo} numberOfLines={1}>
          {dieta.nome} — Planejamento semanal
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <ContadorListaCompras
            totalItens={totalItens}
            totalMarcados={marcados.size}
            onDesmarcarTodos={() => desmarcarTodos(dietaId)}
          />
        </View>
      </View>

      <FlatList
        data={grupos}
        keyExtractor={(g) => g.categoria.id}
        renderItem={({ item }) => (
          <GrupoCategoriaCard dietaId={dietaId} grupo={item} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: footerH + spacing.md },
        ]}
        ListEmptyComponent={
          <EmptyState
            title="Lista vazia"
            subtitle="Adicione alimentos às refeições para gerar a lista"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {grupos.length > 0 && (
        <View style={styles.footer} onLayout={onFooterLayout}>
          <Button
            variant="success"
            icon={<Share2 size={18} color="#FFFFFF" strokeWidth={2.4} />}
            onPress={handleShare}
          >
            Compartilhar lista
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  tituloBlock: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.md,
    gap: 4,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
