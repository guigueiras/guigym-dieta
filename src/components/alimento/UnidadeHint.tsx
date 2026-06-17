import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Info } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import type { UnidadeMedida } from '@/types';
import type { CategoriaId } from '@/constants/categorias';

interface Props {
  unidade: UnidadeMedida;
  categoria?: CategoriaId;
}

function UnidadeHintBase({ unidade, categoria }: Props) {
  const isLiquido = unidade === 'ml';
  const isUnidade = unidade === 'un';
  const exemploUnidade = categoria === 'vegetais' ? '1 cebola' : '1 banana';

  return (
    <Animated.View
      key={unidade}
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      style={[
        styles.wrap,
        isLiquido && styles.wrapLiquido,
        isUnidade && styles.wrapUnidade,
      ]}
    >
      <View style={[
        styles.iconWrap,
        isLiquido && styles.iconWrapLiquido,
        isUnidade && styles.iconWrapUnidade,
      ]}>
        <Info
          size={14}
          color={isUnidade ? colors.warning : isLiquido ? colors.primary : colors.textSecondary}
          strokeWidth={2.4}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[
          styles.titulo,
          isLiquido && styles.tituloLiquido,
          isUnidade && styles.tituloUnidade,
        ]}>
          {isUnidade ? 'Valores por 1 unidade' : isLiquido ? 'Valores por 100ml' : 'Valores por 100g'}
        </Text>
        <Text style={styles.subtitulo}>
          {isUnidade
            ? `Insira os macros de 1 unidade (ex: ${exemploUnidade}). Os valores podem ser imprecisos pois o tamanho varia.`
            : <>Proteína, carbo e gordura são sempre em <Text style={styles.bold}>gramas</Text>{isLiquido ? ', mesmo para líquidos' : ''}.</>
          }
        </Text>
      </View>
    </Animated.View>
  );
}

export const UnidadeHint = memo(UnidadeHintBase);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  wrapLiquido: {
    backgroundColor: colors.primaryLight,
    borderColor: 'transparent',
  },
  wrapUnidade: {
    backgroundColor: colors.warningLight,
    borderColor: 'transparent',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconWrapLiquido: { backgroundColor: '#FFFFFF' },
  iconWrapUnidade: { backgroundColor: '#FFFFFF' },
  textWrap: { flex: 1, gap: 2 },
  titulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  },
  tituloLiquido: { color: colors.primaryText },
  tituloUnidade: { color: colors.warningText },
  subtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  bold: { fontWeight: '700', color: colors.text },
});
