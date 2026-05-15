import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';
import { ItemCompraLinha } from './ItemCompraLinha';
import type { GrupoCompra } from '@/utils/listaCompras';

interface Props {
  dietaId: string;
  grupo: GrupoCompra;
}

function GrupoCategoriaCardBase({ dietaId, grupo }: Props) {
  return (
    <View
      style={styles.card}
      accessibilityRole="list"
      accessibilityLabel={`Categoria ${grupo.categoria.label}, ${grupo.itens.length} ${grupo.itens.length === 1 ? 'item' : 'itens'}`}
    >
      <Text style={styles.header} accessibilityRole="header">
        {grupo.categoria.label}
      </Text>

      <View style={styles.itens}>
        {grupo.itens.map((item, i) => (
          <View key={item.alimentoId}>
            <ItemCompraLinha
              dietaId={dietaId}
              alimentoId={item.alimentoId}
              nome={item.nome}
              quantidade={item.totalCompra}
              quantidadePreparada={item.totalPreparado}
              temConversao={item.temConversao}
              unidade={item.unidade}
            />
            {i < grupo.itens.length - 1 && <View style={styles.sep} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export const GrupoCategoriaCard = memo(GrupoCategoriaCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itens: { paddingHorizontal: spacing.lg },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
