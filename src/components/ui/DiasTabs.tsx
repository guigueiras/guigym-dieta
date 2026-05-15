import { useRef, useEffect, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import { DIAS_SEMANA } from '@/constants';
import type { DiaSemana } from '@/types';

interface Props {
  valor: DiaSemana;
  onChange: (d: DiaSemana) => void;
}

const TAB_HEIGHT = 34;
const TAB_GAP = 4;
const TAB_PADDING_H = 14;

interface TabLayout { x: number; w: number }

export function DiasTabs({ valor, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [layouts, setLayouts] = useState<Record<string, TabLayout>>({});

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    const l = layouts[valor];
    if (!l) return;

    const isFirstReveal = indicatorW.value === 0;
    const springOpts = { damping: 24, stiffness: 240, mass: 0.7 };

    if (isFirstReveal) {
      indicatorX.value = l.x;
      indicatorW.value = l.w;
      indicatorOpacity.value = withTiming(1, { duration: 180 });
    } else {
      indicatorX.value = withSpring(l.x, springOpts);
      indicatorW.value = withSpring(l.w, springOpts);
    }

    scrollRef.current?.scrollTo({
      x: Math.max(0, l.x - 16),
      animated: true,
    });
  }, [valor, layouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
    opacity: indicatorOpacity.value,
  }));

  const handleLayout = (key: DiaSemana) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const cur = prev[key];
      if (cur && Math.abs(cur.x - x) < 0.5 && Math.abs(cur.w - width) < 0.5) return prev;
      return { ...prev, [key]: { x, w: width } };
    });
  };

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

        {DIAS_SEMANA.map((d) => (
          <DiaTab
            key={d.key}
            label={d.label}
            ativo={valor === d.key}
            onPress={() => onChange(d.key as DiaSemana)}
            onLayout={handleLayout(d.key as DiaSemana)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface DiaTabProps {
  label: string;
  ativo: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

function DiaTab({ label, ativo, onPress, onLayout }: DiaTabProps) {
  const colorProgress = useSharedValue(ativo ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    colorProgress.value = withTiming(ativo ? 1 : 0, {
      duration: 200, easing: Easing.out(Easing.quad),
    });
  }, [ativo]);

  const textStyle = useAnimatedStyle(() => ({
    color: colorProgress.value >= 0.5 ? '#FFFFFF' : colors.textSecondary,
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
      accessibilityLabel={label}
      style={styles.tab}
    >
      <Animated.Text style={[styles.tabText, textStyle]} allowFontScaling={false}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
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
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});