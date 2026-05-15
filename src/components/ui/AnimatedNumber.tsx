import { useEffect, useRef, useState } from 'react';
import { Text, type TextStyle, type StyleProp, Platform } from 'react-native';

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Anima a transição numérica via JS (rAF). Funciona em New Architecture (Fabric)
 * — diferente da técnica antiga `animatedProps={{ text }}`, que dependia de uma
 * prop nativa interna do <Text> que o Fabric não expõe mais.
 */
export function AnimatedNumber({
  value,
  decimals = 1,
  duration = 320,
  prefix = '',
  suffix = '',
  style,
}: Props) {
  const [display, setDisplay] = useState<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const fromV = display;
    const delta = value - fromV;

    // Se a diferença é menor que a precisão exibida, vai direto.
    const epsilon = Math.pow(10, -decimals - 1);
    if (Math.abs(delta) < epsilon || duration <= 0) {
      setDisplay(value);
      return;
    }

    const start =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(fromV + delta * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // `display` propositalmente fora das deps: só queremos disparar
    // quando `value` ou `duration`/`decimals` mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, decimals]);

  const formatted =
    decimals === 0
      ? Math.round(display).toString()
      : (Math.round(display * Math.pow(10, decimals)) / Math.pow(10, decimals))
          .toFixed(decimals);

  return (
    <Text
      allowFontScaling={false}
      style={[
        {
          fontVariant: ['tabular-nums'],
          ...(Platform.OS === 'web' ? ({ fontFeatureSettings: '"tnum"' } as any) : {}),
        },
        style,
      ]}
    >
      {`${prefix}${formatted}${suffix}`}
    </Text>
  );
}