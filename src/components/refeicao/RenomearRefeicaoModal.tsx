import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { useEditActions, useEditRefeicao } from '@/stores/useEditDietaStore';
import type { DiaSemana } from '@/types';
import { hap } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  dia: DiaSemana;
  refeicaoId: string | null;
}

export function RenomearRefeicaoModal({ visible, onClose, dia, refeicaoId }: Props) {
  const refeicao = useEditRefeicao(dia, refeicaoId ?? '');
  const { renameRefeicao } = useEditActions();

  const [nome, setNome] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    setNome(refeicao?.nome ?? '');
    const t = setTimeout(() => {
      inputRef.current?.focus();
      // Seleciona o texto inteiro pra o usuário poder digitar por cima
      // (truque iOS: focar e em seguida pedir setSelection via setNativeProps).
    }, 260);
    return () => clearTimeout(t);
  }, [visible, refeicao?.nome]);

  const podeConfirmar = nome.trim().length > 0 && nome.trim() !== refeicao?.nome;

  const confirmar = () => {
    if (!podeConfirmar || !refeicaoId) return;
    Keyboard.dismiss();
    renameRefeicao(dia, refeicaoId, nome.trim());
    hap.add();
    onClose();
  };

  return (
    <ResponsiveModal
      visible={visible}
      onClose={onClose}
      title="Renomear refeição"
      footerActions={
        <>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={onClose}>Cancelar</Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button
              variant="primary"
              disabled={!podeConfirmar}
              onPress={confirmar}
            >
              Salvar
            </Button>
          </View>
        </>
      }
    >
      <View style={styles.field}>
        <Text style={styles.label}>Nome da refeição</Text>
        <TextInput
          ref={inputRef}
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Pré-treino"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={confirmar}
          blurOnSubmit
          maxLength={40}
          autoCapitalize="sentences"
          selectTextOnFocus
        />
      </View>
    </ResponsiveModal>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
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
});