import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';

import { useModelosActions } from '@/stores/useModelosRefeicaoStore';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { colors, spacing, radii } from '@/theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  modeloId?: string;
  nomeInicial?: string;
  onSuccess?: (id: string) => void;
}

export function NovoModeloModal({ visible, onClose, modeloId, nomeInicial, onSuccess }: Props) {
  const { criar, renomear } = useModelosActions();
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = modeloId !== undefined;
  const titulo = isEditing ? 'Renomear modelo' : 'Novo modelo';

  useEffect(() => {
    if (visible) {
      setNome(nomeInicial ?? '');
    }
  }, [visible]);

  async function handleSalvar() {
    const nomeTrimmed = nome.trim();
    if (!nomeTrimmed) {
      Alert.alert('Nome obrigatório', 'Insira um nome para o modelo.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await renomear(modeloId, nomeTrimmed);
        onSuccess?.(modeloId);
      } else {
        const id = await criar(nomeTrimmed);
        onSuccess?.(id);
      }
      onClose();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o modelo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveModal visible={visible} onClose={onClose} title={titulo}>
      <View style={styles.body}>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Nome do modelo"
          placeholderTextColor={colors.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSalvar}
          maxLength={80}
        />

        <Pressable
          onPress={handleSalvar}
          disabled={saving}
          style={({ pressed }) => [styles.btn, (pressed || saving) && styles.btnPressed]}
        >
          <Text style={styles.btnText}>{isEditing ? 'Salvar' : 'Criar'}</Text>
        </Pressable>
      </View>
    </ResponsiveModal>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
