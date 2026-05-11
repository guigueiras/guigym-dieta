import { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn, FadeOut,
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { Info } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import type { UnidadeMedida } from '@/types';

interface Props {
  unidade: UnidadeMedida;
}

function UnidadeHintBase({ unidade }: Props) {
  const isLiquido = unidade === 'ml';

  const opacity = useSharedValue(isLiquido ? 1 : 0.85);

  useEffect(() => {
    opacity.value = withTiming(isLiquido ? 1 : 0.85, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [isLiquido]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      key={unidade}
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      style={[
        styles.wrap,
        isLiquido && styles.wrapLiquido,
        opacityStyle,
      ]}
    >
      <View style={[styles.iconWrap, isLiquido && styles.iconWrapLiquido]}>
        <Info
          size={14}
          color={isLiquido ? colors.primary : colors.textSecondary}
          strokeWidth={2.4}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.titulo, isLiquido && styles.tituloLiquido]}>
          {isLiquido ? 'Valores por 100ml' : 'Valores por 100g'}
        </Text>
        <Text style={styles.subtitulo}>
          Proteína, carbo e gordura são sempre em <Text style={styles.bold}>gramas</Text>
          {isLiquido ? ', mesmo para líquidos' : ''}.
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
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconWrapLiquido: {
    backgroundColor: '#FFFFFF',
  },
  textWrap: { flex: 1, gap: 2 },
  titulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  },
  tituloLiquido: {
    color: colors.primaryText,
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  bold: { fontWeight: '700', color: colors.text },
});
