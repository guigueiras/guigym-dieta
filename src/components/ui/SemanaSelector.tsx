import { useRef, useEffect, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, View, Text, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';
import type { DuracaoConfig } from '@/types';

interface Props {
  semanaAtiva: number;
  totalSemanas: number;
  duracao: DuracaoConfig;
  onChange: (numero: number) => void;
}

const TAB_HEIGHT = 34;
const TAB_GAP = 4;
const TAB_PADDING_H = 14;

interface TabLayout { x: number; w: number }

function semanaLabel(numero: number, duracao: DuracaoConfig): string {
  if (duracao.tipo === 'dias') {
    const inicio = (numero - 1) * 7 + 1;
    const fim = Math.min(numero * 7, duracao.quantidade);
    return `Dias ${inicio}–${fim}`;
  }
  return `Semana ${numero}`;
}

export function SemanaSelector({ semanaAtiva, totalSemanas, duracao, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [layouts, setLayouts] = useState<Record<number, TabLayout>>({});

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    const l = layouts[semanaAtiva];
    if (!l) return;
    const isFirst = indicatorW.value === 0;
    const spring = { damping: 24, stiffness: 240, mass: 0.7 };
    if (isFirst) {
      indicatorX.value = l.x;
      indicatorW.value = l.w;
      indicatorOpacity.value = withTiming(1, { duration: 180 });
    } else {
      indicatorX.value = withSpring(l.x, spring);
      indicatorW.value = withSpring(l.w, spring);
    }
    scrollRef.current?.scrollTo({ x: Math.max(0, l.x - 16), animated: true });
  }, [semanaAtiva, layouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
    opacity: indicatorOpacity.value,
  }));

  const handleLayout = (numero: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const cur = prev[numero];
      if (cur && Math.abs(cur.x - x) < 0.5 && Math.abs(cur.w - width) < 0.5) return prev;
      return { ...prev, [numero]: { x, w: width } };
    });
  };

  const numeros = Array.from({ length: totalSemanas }, (_, i) => i + 1);

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}
        overScrollMode="never"
      >
        <Animated.View style={[styles.indicator, indicatorStyle]} pointerEvents="none" />

        {numeros.map((n) => (
          <SemanaTab
            key={n}
            label={semanaLabel(n, duracao)}
            ativo={semanaAtiva === n}
            onPress={() => { hap.select(); onChange(n); }}
            onLayout={handleLayout(n)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface TabProps {
  label: string;
  ativo: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

function SemanaTab({ label, ativo, onPress, onLayout }: TabProps) {
  const colorProg = useSharedValue(ativo ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    colorProg.value = withTiming(ativo ? 1 : 0, { duration: 200, easing: Easing.out(Easing.quad) });
  }, [ativo]);

  const textStyle = useAnimatedStyle(() => ({
    color: colorProg.value >= 0.5 ? '#FFFFFF' : colors.textSecondary,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      onPressIn={() => { scale.value = withTiming(0.94, { duration: 90 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 240 }); }}
      hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativo }}
      style={styles.tab}
    >
      <Animated.Text style={[styles.tabText, textStyle]} allowFontScaling={false}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: spacing.xs, paddingBottom: 2 },
  content: {
    paddingHorizontal: spacing.screenH,
    gap: TAB_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: TAB_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: TAB_HEIGHT / 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  tab: {
    height: TAB_HEIGHT,
    paddingHorizontal: TAB_PADDING_H,
    borderRadius: TAB_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
});
