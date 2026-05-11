import Animated, {
  FadeIn, FadeOut, LinearTransition, Easing,
} from 'react-native-reanimated';
import type { PropsWithChildren } from 'react';
import { ViewStyle } from 'react-native';

export function AnimatedListItem({
  children, style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <Animated.View
      entering={FadeIn.duration(220).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(160).easing(Easing.in(Easing.cubic))}
      layout={LinearTransition.springify().damping(20).stiffness(220).mass(0.7)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
