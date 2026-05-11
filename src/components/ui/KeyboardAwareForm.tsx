import { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
  dismissOnTapOutside?: boolean;
  behavior?: 'padding' | 'height' | 'position';
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle' | 'keyboardShouldPersistTaps'>;
}

export function KeyboardAwareForm({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  dismissOnTapOutside = true,
  behavior,
  scrollProps,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const handler = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') return;
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 220);
    };

    document.addEventListener('focusin', handler);
    return () => document.removeEventListener('focusin', handler);
  }, []);

  const _behavior = behavior ?? (Platform.OS === 'ios' ? 'padding' : 'height');

  const Body = (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      behavior={_behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[styles.flex, style]}
    >
      {dismissOnTapOutside ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>{Body}</View>
        </TouchableWithoutFeedback>
      ) : (
        Body
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
