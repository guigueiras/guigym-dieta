import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  scaleTo?: number;
  duration?: number;
  style?: any;
}

export function PressableScale({
  children, scaleTo = 0.97, duration = 120, style, onPressIn, onPressOut, ...rest
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration, easing: Easing.out(Easing.quad) });
        opacity.value = withTiming(0.85, { duration });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: duration + 60, easing: Easing.out(Easing.cubic) });
        opacity.value = withTiming(1, { duration });
        onPressOut?.(e);
      }}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
