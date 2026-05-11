import { useState, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export function useElementHeight() {
  const [height, setHeight] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setHeight((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
  }, []);
  return { height, onLayout };
}
