import { Pressable, Text, StyleSheet, ActivityIndicator, View, Keyboard } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import type { ReactNode } from 'react';
import { colors, spacing } from '@/theme/colors';
import { hap } from '@/utils/haptics';

const APressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface Props {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  haptic?: boolean;
  dismissKeyboard?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  numberOfLines?: number;
}

export function Button({
  children,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'lg',
  fullWidth = true,
  haptic = true,
  dismissKeyboard = true,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  numberOfLines = 1,
}: Props) {
  const v = VARIANTS[variant];
  const dis = disabled || loading;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (dis) return;
    if (haptic) hap.tap();
    if (dismissKeyboard) Keyboard.dismiss();
    onPress?.();
  };

  return (
    <APressable
      onPressIn={() => { if (!dis) scale.value = withTiming(0.97, { duration: 100, easing: Easing.out(Easing.quad) }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }); }}
      onPress={handlePress}
      disabled={dis}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!dis, busy: !!loading }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: v.bg, borderColor: v.border ?? v.bg },
        fullWidth && { alignSelf: 'stretch' },
        dis && styles.disabled,
        animStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={[styles.text, { color: v.fg }]}
            numberOfLines={numberOfLines}
            allowFontScaling={false}
          >
            {children}
          </Text>
        </View>
      )}
    </APressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary:   { bg: colors.primary, fg: '#FFFFFF' },
  secondary: { bg: '#FFFFFF',      fg: colors.text, border: colors.border },
  success:   { bg: colors.success, fg: '#FFFFFF' },
  danger:    { bg: colors.danger,  fg: '#FFFFFF' },
  ghost:     { bg: 'transparent',  fg: colors.text, border: 'transparent' },
};

const styles = StyleSheet.create({
  base: { borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lg: { height: 52, paddingHorizontal: spacing.lg },
  md: { height: 40, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  disabled: { opacity: 0.4 },
});
