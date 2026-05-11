import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedListItem } from '@/components/ui/AnimatedListItem';
import { DietaListItem } from '@/components/dieta/DietaListItem';
import { DietaListItemSkeleton } from '@/components/dieta/DietaListItemSkeleton';
import { NovaDietaModal } from '@/components/dieta/NovaDietaModal';
import {
  useDietasLoaded, useDietasIds, useDietasFiltradas,
} from '@/stores/useDietasStore';

export default function DietasScreen() {
  const loaded = useDietasLoaded();
  const totalIds = useDietasIds();
  const [busca, setBusca] = useState('');
  const idsFiltrados = useDietasFiltradas(busca);
  const [criarOpen, setCriarOpen] = useState(false);

  const naoTemNada = loaded && totalIds.length === 0;
  const semResultados = loaded && totalIds.length > 0 && idsFiltrados.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Minhas Dietas</Text>
        <Text style={styles.subtitulo}>Organize sua alimentação semanal</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar dieta..."
          editable={loaded && totalIds.length > 0}
        />
      </View>

      {!loaded ? (
        <View style={styles.skeletonList}>
          <DietaListItemSkeleton />
          <DietaListItemSkeleton />
          <DietaListItemSkeleton />
          <DietaListItemSkeleton />
        </View>
      ) : (
        <FlatList
          data={idsFiltrados}
          keyExtractor={(id) => id}
          renderItem={({ item }) => (
            <AnimatedListItem>
              <DietaListItem id={item} />
            </AnimatedListItem>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.cardGap }} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            naoTemNada ? (
              <EmptyState
                title="Você ainda não tem dietas"
                subtitle='Toque em "Nova Dieta" para começar'
              />
            ) : semResultados ? (
              <EmptyState
                title="Nenhuma dieta encontrada"
                subtitle="Tente outra busca"
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Button
          variant="primary"
          icon={<Plus size={20} color="#FFFFFF" strokeWidth={2.6} />}
          onPress={() => setCriarOpen(true)}
        >
          Nova Dieta
        </Button>
      </View>

      <NovaDietaModal
        visible={criarOpen}
        modo="criar"
        onClose={() => setCriarOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
  },
  subtitulo: { fontSize: 14, color: colors.textSecondary, fontWeight: '400' },
  searchWrap: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.md,
  },
  skeletonList: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
