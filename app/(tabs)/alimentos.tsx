import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedListItem } from '@/components/ui/AnimatedListItem';
import { Highlight } from '@/components/ui/Highlight';
import { AlimentoCard } from '@/components/alimento/AlimentoCard';
import { AlimentoCardSkeleton } from '@/components/alimento/AlimentoCardSkeleton';
import { AlimentoFormModal } from '@/components/alimento/AlimentoFormModal';
import {
  useAlimentosLoaded, useAlimentosStore,
  useAlimentosFiltrados, useUltimoCriadoId, useAlimentosActions,
} from '@/stores/useAlimentosStore';

export default function AlimentosScreen() {
  const loaded = useAlimentosLoaded();
  const totalIds = useAlimentosStore((s) => s.ids);
  const [busca, setBusca] = useState('');
  const idsFiltrados = useAlimentosFiltrados(busca);
  const ultimoCriadoId = useUltimoCriadoId();
  const { clearUltimoCriado } = useAlimentosActions();

  const [formOpen, setFormOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!ultimoCriadoId) return;
    const t = setTimeout(() => clearUltimoCriado(), 1200);
    return () => clearTimeout(t);
  }, [ultimoCriadoId, clearUltimoCriado]);

  const naoTemNada = loaded && totalIds.length === 0;
  const semResultados = loaded && totalIds.length > 0 && idsFiltrados.length === 0;

  const abrirCriar = () => {
    setEditandoId(null);
    setFormOpen(true);
  };

  const abrirEditar = (id: string) => {
    setEditandoId(id);
    setFormOpen(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Alimentos</Text>
        <Text style={styles.subtitulo}>Sua biblioteca pessoal de alimentos</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar alimento..."
          editable={loaded && totalIds.length > 0}
        />
      </View>

      {!loaded ? (
        <View style={styles.skeletonList}>
          <AlimentoCardSkeleton />
          <AlimentoCardSkeleton />
          <AlimentoCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={idsFiltrados}
          keyExtractor={(id) => id}
          renderItem={({ item }) => (
            <AnimatedListItem>
              <Highlight highlightKey={ultimoCriadoId === item ? item : undefined}>
                <AlimentoCard id={item} onEditar={() => abrirEditar(item)} />
              </Highlight>
            </AnimatedListItem>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.cardGap }} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            naoTemNada ? (
              <EmptyState
                title="Nenhum alimento cadastrado"
                subtitle='Toque em "Novo Alimento" para começar'
              />
            ) : semResultados ? (
              <EmptyState
                title="Nenhum alimento encontrado"
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
          onPress={abrirCriar}
        >
          Novo Alimento
        </Button>
      </View>

      <AlimentoFormModal
        visible={formOpen}
        modo={editandoId ? 'editar' : 'criar'}
        alimentoId={editandoId ?? undefined}
        onClose={() => {
          setFormOpen(false);
          setTimeout(() => setEditandoId(null), 200);
        }}
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
