import { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

import { useModelosIds, useModelosRefeicaoStore } from '@/stores/useModelosRefeicaoStore';
import { SearchBar } from '@/components/ui/SearchBar';
import { matchTermo } from '@/utils/text';
import { ModeloListItem } from '@/components/modelos/ModeloListItem';
import { NovoModeloModal } from '@/components/modelos/NovoModeloModal';
import { AnimatedListItem } from '@/components/ui/AnimatedListItem';
import { colors, spacing } from '@/theme/colors';

export default function RefeicoesScreen() {
  const ids = useModelosIds();
  const byId = useModelosRefeicaoStore((s) => s.byId);
  const [modalVisible, setModalVisible] = useState(false);
  const [busca, setBusca] = useState('');

  const idsFiltrados = useMemo(() => {
    if (!busca.trim()) return ids;
    return ids.filter((id) => {
      const m = byId[id];
      return m ? matchTermo(m.nome, busca) : false;
    });
  }, [ids, byId, busca]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Modelos de Refeição</Text>
        <Text style={styles.subtitulo}>Seus modelos de refeição</Text>
      </View>
      <View style={styles.searchWrap}>
        <SearchBar value={busca} onChangeText={setBusca} placeholder="Buscar modelo..." />
      </View>
      <FlatList
        data={idsFiltrados}
        keyExtractor={(id) => id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: id }) => (
          <AnimatedListItem>
            <ModeloListItem id={id} />
          </AnimatedListItem>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {busca ? 'Nenhum modelo encontrado' : 'Nenhum modelo criado'}
            </Text>
            <Text style={styles.emptySub}>
              {busca ? 'Tente outra busca' : 'Toque em + para criar o primeiro'}
            </Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <Button
          variant="primary"
          icon={<Plus size={20} color="#FFFFFF" strokeWidth={2.6} />}
          onPress={() => setModalVisible(true)}
        >
          Novo Modelo
        </Button>
      </View>

      <NovoModeloModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  subtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  searchWrap: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
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
