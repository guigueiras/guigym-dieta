import { useEffect } from 'react';
import { Text, type TextStyle, type StyleProp, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing,
} from 'react-native-reanimated';

const AText = Animated.createAnimatedComponent(Text);

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}

export function AnimatedNumber({
  value,
  decimals = 1,
  duration = 320,
  prefix = '',
  suffix = '',
  style,
}: Props) {
  const display = useSharedValue(value);

  useEffect(() => {
    display.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  const animatedProps = useAnimatedProps(() => {
    const v = display.value;
    const formatted =
      decimals === 0
        ? Math.round(v).toString()
        : (Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals))
            .toFixed(decimals);
    return { text: `${prefix}${formatted}${suffix}` } as any;
  });

  return (
    <AText
      // @ts-ignore
      animatedProps={animatedProps}
      allowFontScaling={false}
      style={[
        {
          fontVariant: ['tabular-nums'],
          ...(Platform.OS === 'web' ? ({ fontFeatureSettings: '"tnum"' } as any) : {}),
        },
        style,
      ]}
    />
  );
}
