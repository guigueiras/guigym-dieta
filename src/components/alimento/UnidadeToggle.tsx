import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, radii } from '@/theme/colors';
import type { UnidadeMedida } from '@/types';
import { hap } from '@/utils/haptics';

interface Props {
  value: UnidadeMedida;
  onChange: (v: UnidadeMedida) => void;
}

const OPCOES: Array<{ id: UnidadeMedida; label: string }> = [
  { id: 'g',  label: 'g'   },
  { id: 'ml', label: 'ml'  },
  { id: 'un', label: 'un.' },
];

const HEIGHT = 46;

export function UnidadeToggle({ value, onChange }: Props) {
  const [containerW, setContainerW] = useState(0);
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (containerW === 0) return;
    const segW = (containerW - 4) / OPCOES.length;
    const idx = OPCOES.findIndex((o) => o.id === value);
    indicatorX.value = withSpring(idx * segW, { damping: 22, stiffness: 240, mass: 0.8 });
  }, [value, containerW]);

  const indicatorStyle = useAnimatedStyle(() => {
    const segW = containerW > 0 ? (containerW - 4) / OPCOES.length : 0;
    return {
      width: segW,
      transform: [{ translateX: indicatorX.value }],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width);

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Animated.View style={[styles.indicator, indicatorStyle]} pointerEvents="none" />
      {OPCOES.map((o) => {
        const ativo = o.id === value;
        return (
          <Pressable
            key={o.id}
            style={styles.seg}
            onPress={() => {
              if (ativo) return;
              hap.select();
              onChange(o.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`Unidade ${o.id === 'g' ? 'gramas' : o.id === 'ml' ? 'mililitros' : 'unidade'}`}
          >
            <SegText label={o.label} ativo={ativo} />
          </Pressable>
        );
      })}
    </View>
  );
}

function SegText({ label, ativo }: { label: string; ativo: boolean }) {
  const colorProgress = useSharedValue(ativo ? 1 : 0);

  useEffect(() => {
    colorProgress.value = withTiming(ativo ? 1 : 0, {
      duration: 220, easing: Easing.out(Easing.quad),
    });
  }, [ativo]);

  const textStyle = useAnimatedStyle(() => ({
    color: colorProgress.value >= 0.5 ? '#FFFFFF' : colors.text,
  }));

  return <Animated.Text style={[styles.segText, textStyle]}>{label}</Animated.Text>;
}

const styles = StyleSheet.create({
  wrap: {
    height: HEIGHT,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    height: HEIGHT - 8,
    backgroundColor: colors.primary,
    borderRadius: radii.md - 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  segText: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
});
