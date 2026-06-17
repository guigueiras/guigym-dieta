import { Modal, View, Pressable, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { useEditActions } from '@/stores/useEditDietaStore';
import { hap } from '@/utils/haptics';
import type { DiaSemana } from '@/types';

interface Props {
  visible: boolean;
  anchor: { x: number; y: number } | null;
  dia: DiaSemana;
  refeicaoId: string;
  refeicaoNome: string;
  podeExcluir: boolean;
  onClose: () => void;
  onRenomear: () => void;
  onSalvarComoModelo: () => void;
}

const MENU_W = 180;
const MENU_H = 140;

export function RefeicaoActionsMenu({
  visible, anchor, dia, refeicaoId, refeicaoNome, podeExcluir, onClose, onRenomear, onSalvarComoModelo,
}: Props) {
  const { removeRefeicao } = useEditActions();

  const screen = Dimensions.get('window');
  const left = anchor ? Math.min(Math.max(8, anchor.x - MENU_W), screen.width - MENU_W - 8) : 0;
  const top  = anchor ? Math.min(anchor.y + 4, screen.height - MENU_H - 8) : 0;

  const handleSalvarComoModelo = () => {
    onClose();
    setTimeout(() => onSalvarComoModelo(), 50);
  };

  const handleRenomear = () => {
    onClose();
    setTimeout(() => onRenomear(), 50);
  };

  const handleExcluir = () => {
    onClose();
    if (!podeExcluir) return;
    Alert.alert(
      'Excluir refeição',
      `Tem certeza que deseja excluir "${refeicaoNome}"? Os alimentos adicionados nela serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            hap.remove();
            removeRefeicao(dia, refeicaoId);
          },
        },
      ]
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.menu, { left, top }]}>
          <Pressable
            onPress={handleSalvarComoModelo}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Text style={styles.itemText}>Salvar como modelo</Text>
          </Pressable>
          <View style={styles.sep} />
          <Pressable
            onPress={handleRenomear}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Text style={styles.itemText}>Renomear</Text>
          </Pressable>
          <View style={styles.sep} />
          <Pressable
            onPress={handleExcluir}
            disabled={!podeExcluir}
            style={({ pressed }) => [
              styles.item,
              pressed && podeExcluir && styles.itemPressed,
            ]}
          >
            <Text style={[styles.itemText, podeExcluir ? styles.danger : styles.disabled]}>
              Excluir
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.001)' },
  menu: {
    position: 'absolute',
    width: MENU_W,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  item: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  itemPressed: { backgroundColor: colors.surface },
  itemText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  danger: { color: colors.danger, fontWeight: '600' },
  disabled: { color: colors.textMuted },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
