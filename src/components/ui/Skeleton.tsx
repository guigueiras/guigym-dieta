import { useEffect } from 'react';
import { ViewStyle, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';

interface Props {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, radius = 6, style }: Props) {
  const o = useSharedValue(0.6);

  useEffect(() => {
    o.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E2E8F0' },
        animStyle,
        style,
      ]}
    />
  );
}
