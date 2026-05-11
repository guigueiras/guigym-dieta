import { useEffect, useState, useRef } from 'react';
import {
  Modal, View, Text, TextInput, StyleSheet, Pressable, Keyboard, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, Easing,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { KeyboardAwareForm } from '@/components/ui/KeyboardAwareForm';
import { CategoriaSelect } from './CategoriaSelect';
import { UnidadeToggle } from './UnidadeToggle';
import { UnidadeHint } from './UnidadeHint';
import { MacroInput } from './MacroInput';
import { useAlimento, useAlimentosActions } from '@/stores/useAlimentosStore';
import { CATEGORIA_PADRAO, type CategoriaId } from '@/constants/categorias';
import type { UnidadeMedida } from '@/types';
import { hap } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  modo: 'criar' | 'editar';
  alimentoId?: string;
}

export function AlimentoFormModal({ visible, onClose, modo, alimentoId }: Props) {
  const alimento = useAlimento(alimentoId);
  const { criar, atualizar } = useAlimentosActions();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaId>(CATEGORIA_PADRAO);
  const [unidade, setUnidade] = useState<UnidadeMedida>('g');
  const [proteina, setProteina] = useState<number | null>(null);
  const [carbo, setCarbo] = useState<number | null>(null);
  const [gordura, setGordura] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mounted, setMounted] = useState(visible);

  const nomeRef = useRef<TextInput>(null);

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    if (modo === 'editar' && alimento) {
      setNome(alimento.nome);
      setCategoria(alimento.categoria);
      setUnidade(alimento.unidade);
      setProteina(alimento.proteina);
      setCarbo(alimento.carbo);
      setGordura(alimento.gordura);
    } else {
      setNome('');
      setCategoria(CATEGORIA_PADRAO);
      setUnidade('g');
      setProteina(null);
      setCarbo(null);
      setGordura(null);
    }
  }, [visible, modo, alimento]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      cardOpacity.value    = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      cardScale.value      = withSpring(1, { damping: 18, stiffness: 220, mass: 0.9 });

      const t = setTimeout(() => nomeRef.current?.focus(), 280);
      return () => clearTimeout(t);
    } else {
      Keyboard.dismiss();
      backdropOpacity.value = withTiming(0, { duration: 160 });
      cardOpacity.value     = withTiming(0, { duration: 160 });
      cardScale.value       = withTiming(0.94, { duration: 160 }, (fin) => {
        if (fin) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const nomeValido = nome.trim().length >= 1;
  const macrosValidos = (proteina ?? 0) >= 0 && (carbo ?? 0) >= 0 && (gordura ?? 0) >= 0;
  const podeSalvar = nomeValido && macrosValidos && !salvando;

  const fechar = () => {
    Keyboard.dismiss();
    onClose();
  };

  const confirmar = async () => {
    if (!podeSalvar) return;
    Keyboard.dismiss();
    setSalvando(true);

    try {
      const dados = {
        nome: nome.trim(),
        categoria,
        unidade,
        proteina: proteina ?? 0,
        carbo: carbo ?? 0,
        gordura: gordura ?? 0,
      };

      if (modo === 'editar' && alimentoId) {
        await atualizar(alimentoId, dados);
      } else {
        await criar(dados);
      }
      hap.add();
      onClose();
    } catch {
      hap.error();
      Alert.alert('Erro', 'Não foi possível salvar o alimento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
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
            <Text style={styles.title}>
              {modo === 'editar' ? 'Editar Alimento' : 'Novo Alimento'}
            </Text>
            <Pressable
              onPress={fechar}
              hitSlop={14}
              style={styles.closeBtn}
              accessibilityLabel="Fechar"
            >
              <X size={20} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              ref={nomeRef}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Peito de Frango"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, nomeValido && styles.inputFocused]}
              returnKeyType="next"
              maxLength={60}
              autoCapitalize="sentences"
              autoCorrect={false}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1.4 }]}>
              <Text style={styles.label}>Categoria</Text>
              <CategoriaSelect value={categoria} onChange={setCategoria} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unidade</Text>
              <UnidadeToggle value={unidade} onChange={setUnidade} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Macros (sempre em gramas)</Text>
            <View style={styles.macrosRow}>
              <MacroInput label="PROTEÍNA (g)" value={proteina} onChange={setProteina} cor={colors.macroProtein} />
              <MacroInput label="CARBO (g)"    value={carbo}    onChange={setCarbo}    cor={colors.macroCarb} />
              <MacroInput label="GORDURA (g)"  value={gordura}  onChange={setGordura}  cor={colors.macroFat} />
            </View>
          </View>

          <UnidadeHint unidade={unidade} />

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" onPress={fechar}>Cancelar</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                disabled={!podeSalvar}
                loading={salvando}
                onPress={confirmar}
              >
                {modo === 'editar' ? 'Salvar' : 'Adicionar'}
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
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FFFFFF',
  },
  inputFocused: { borderColor: colors.primary },
  macrosRow: { flexDirection: 'row', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
