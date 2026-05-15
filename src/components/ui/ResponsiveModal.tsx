import { useEffect, useState, type ReactNode } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable, Keyboard, useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { KeyboardAwareForm } from './KeyboardAwareForm';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Largura máxima em pixels para telas grandes (default 480). */
  maxWidth?: number;
  /** Margem lateral mínima em telas pequenas (default 12). */
  sideMargin?: number;
  /** Se true, esconde o botão X no header (default false). */
  hideCloseButton?: boolean;
  /** Conteúdo opcional ancorado no bottom do card (botões). */
  footerActions?: ReactNode;
}

const ENTRY_DURATION = 220;
const EXIT_DURATION = 160;

/**
 * Modal centralizado, responsivo, com keyboard avoidance e safe area.
 *
 * Sensação premium iOS:
 *  - backdrop fade-in suave
 *  - card scale spring na entrada
 *  - largura adaptativa por viewport
 *  - footer fixo (não rola com o conteúdo)
 *
 * Unmount lazy: quando `visible` vira false, os children continuam montados
 * por ~160ms (animação de saída) e só então o Modal nativo é desmontado.
 */
export function ResponsiveModal({
  visible,
  onClose,
  title,
  children,
  maxWidth = 480,
  sideMargin = 12,
  hideCloseButton = false,
  footerActions,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, {
        duration: ENTRY_DURATION, easing: Easing.out(Easing.quad),
      });
      cardOpacity.value = withTiming(1, {
        duration: ENTRY_DURATION, easing: Easing.out(Easing.quad),
      });
      cardScale.value = withSpring(1, {
        damping: 18, stiffness: 220, mass: 0.9,
      });
    } else {
      Keyboard.dismiss();
      backdropOpacity.value = withTiming(0, { duration: EXIT_DURATION });
      cardOpacity.value = withTiming(0, { duration: EXIT_DURATION });
      cardScale.value = withTiming(0.94, { duration: EXIT_DURATION }, (fin) => {
        if (fin) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const cardWidth = Math.min(winW - sideMargin * 2, maxWidth);
  // Altura útil máxima: viewport - safe areas - 32 de margem mínima.
  const cardMaxHeight = winH - insets.top - insets.bottom - 32;

  const fechar = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={fechar}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} />
      </Animated.View>

      <KeyboardAwareForm
        style={styles.kavWrap}
        contentContainerStyle={StyleSheet.flatten([
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, spacing.xl),
            paddingBottom: Math.max(insets.bottom, spacing.xl),
          },
        ])}
        dismissOnTapOutside={false}
      >
        <Animated.View
          style={[
            styles.card,
            { width: cardWidth, maxHeight: cardMaxHeight },
            cardStyle,
          ]}
        >
          {(title || !hideCloseButton) && (
            <View style={styles.header}>
              {title ? (
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
              ) : <View style={{ flex: 1 }} />}
              {!hideCloseButton && (
                <Pressable
                  onPress={fechar}
                  hitSlop={14}
                  accessibilityLabel="Fechar"
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                >
                  <X size={20} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.body}>{children}</View>

          {footerActions ? (
            <View style={styles.footer}>{footerActions}</View>
          ) : null}
        </Animated.View>
      </KeyboardAwareForm>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  kavWrap: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnPressed: { backgroundColor: colors.surfaceAlt },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: spacing.md,
    gap: spacing.md + 2,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
});