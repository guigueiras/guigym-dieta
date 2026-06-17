import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';

import { colors, spacing } from '@/theme/colors';
import { HeaderDieta } from '@/components/ui/HeaderDieta';
import { EmptyState } from '@/components/ui/EmptyState';
import { useModelo, useModelosActions } from '@/stores/useModelosRefeicaoStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { PickerAlimentoSheet } from '@/components/modelos/PickerAlimentoSheet';
import { hap } from '@/utils/haptics';

export default function ModeloDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const modelo = useModelo(id);
  const alimentosById = useAlimentosStore((s) => s.byId);
  const { adicionarAlimento, removerAlimento } = useModelosActions();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!modelo || !id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <HeaderDieta titulo="Modelo não encontrado" onBack={() => router.back()} />
        <EmptyState title="Este modelo não existe ou foi removido" />
      </SafeAreaView>
    );
  }

  const excludeIds = modelo.alimentos.map((a) => a.alimentoId);

  const handleSelect = async (alimentoId: string) => {
    setPickerOpen(false);
    await adicionarAlimento(id, alimentoId);
  };

  const handleRemover = async (modeloAlimentoId: string) => {
    hap.remove();
    await removerAlimento(modeloAlimentoId, id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HeaderDieta
        titulo={modelo.nome}
        onBack={() => router.back()}
        actions={
          <Pressable
            onPress={() => { hap.tap(); setPickerOpen(true); }}
            hitSlop={10}
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            accessibilityLabel="Adicionar alimento"
          >
            <Plus size={18} color={colors.primary} strokeWidth={2.2} />
          </Pressable>
        }
      />

      <FlatList
        data={modelo.alimentos}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => {
          const alimento = alimentosById[item.alimentoId];
          if (!alimento) return null;
          return (
            <View style={styles.row}>
              <Text style={styles.nome} numberOfLines={1}>{alimento.nome}</Text>
              <Pressable
                onPress={() => handleRemover(item.id)}
                hitSlop={12}
                style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
                accessibilityLabel="Remover"
              >
                <Trash2 size={16} color={colors.danger} strokeWidth={2.2} />
              </Pressable>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum alimento neste modelo"
            subtitle='Toque em "+" para adicionar'
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <PickerAlimentoSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        excludeIds={excludeIds}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  addBtnPressed: { opacity: 0.7 },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  nome: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  sep: { height: spacing.sm },
  removeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnPressed: { backgroundColor: colors.dangerLight },
});
