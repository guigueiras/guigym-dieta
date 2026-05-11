import { useEffect, useState, useRef } from 'react';
import {
  Modal, View, Text, TextInput, StyleSheet, Pressable, Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, Easing,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { KeyboardAwareForm } from '@/components/ui/KeyboardAwareForm';
import { TipoDietaSelect } from './TipoDietaSelect';
import { useDietasActions, useDieta } from '@/stores/useDietasStore';
import type { TipoDieta } from '@/types';
import { hap } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  modo?: 'criar' | 'editar';
  dietaId?: string;
}

export function NovaDietaModal({ visible, onClose, modo = 'criar', dietaId }: Props) {
  const dietaExistente = useDieta(dietaId);
  const { criar, renomear } = useDietasActions();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoDieta>('Ganho de massa');
  const [salvando, setSalvando] = useState(false);
  const [mounted, setMounted] = useState(visible);
  const inputRef = useRef<TextInput>(null);

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    if (modo === 'editar' && dietaExistente) {
      setNome(dietaExistente.nome);
      setTipo(dietaExistente.tipo);
    } else {
      setNome('');
      setTipo('Ganho de massa');
    }
  }, [visible, modo, dietaExistente]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      cardOpacity.value    = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      cardScale.value      = withSpring(1, { damping: 18, stiffness: 220, mass: 0.9 });

      const t = setTimeout(() => inputRef.current?.focus(), 260);
      return () => clearTimeout(t);
    } else {
      Keyboard.dismiss();
      backdropOpacity.value = withTiming(0, { duration: 160 });
      cardOpacity.value     = withTiming(0, { duration: 160 });
      cardScale.value       = withTiming(0.94, { duration: 160 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const podeConfirmar = nome.trim().length > 0 && !salvando;

  const confirmar = async () => {
    if (!podeConfirmar) return;
    Keyboard.dismiss();
    setSalvando(true);
    try {
      if (modo === 'editar' && dietaId) {
        await renomear(dietaId, nome.trim(), tipo);
      } else {
        await criar(nome.trim(), tipo);
      }
      hap.add();
      onClose();
    } catch {
      hap.error();
    } finally {
      setSalvando(false);
    }
  };

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
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>{modo === 'editar' ? 'Editar Dieta' : 'Nova Dieta'}</Text>
            <Pressable onPress={fechar} hitSlop={14} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nome da dieta</Text>
            <TextInput
              ref={inputRef}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Bulking 2026"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={confirmar}
              blurOnSubmit
              maxLength={60}
              autoCapitalize="sentences"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo de dieta</Text>
            <TipoDietaSelect value={tipo} onChange={setTipo} />
          </View>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" onPress={fechar}>Cancelar</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                disabled={!podeConfirmar}
                loading={salvando}
                onPress={confirmar}
              >
                {modo === 'editar' ? 'Salvar' : 'Criar'}
              </Button>
            </View>
          </View>
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
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  field: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FFFFFF',
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
