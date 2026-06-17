import { Modal, View, Pressable, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useState } from 'react';
import { colors, radii, spacing } from '@/theme/colors';
import { useDietasActions, useDieta } from '@/stores/useDietasStore';
import { NovaDietaModal } from './NovaDietaModal';
import { hap } from '@/utils/haptics';

interface Props {
  visible: boolean;
  anchor: { x: number; y: number } | null;
  dietaId: string;
  onClose: () => void;
}

const MENU_W = 160;
const MENU_H = 92;

export function DietaActionsMenu({ visible, anchor, dietaId, onClose }: Props) {
  const dieta = useDieta(dietaId);
  const { excluir } = useDietasActions();
  const [editando, setEditando] = useState(false);

  const screen = Dimensions.get('window');
  const left = anchor ? Math.min(Math.max(8, anchor.x - MENU_W), screen.width - MENU_W - 8) : 0;
  const top  = anchor ? Math.min(anchor.y + 4, screen.height - MENU_H - 8) : 0;

  const handleEditar = () => {
    onClose();
    setTimeout(() => setEditando(true), 320);
  };

  const handleExcluir = () => {
    onClose();
    Alert.alert(
      'Excluir dieta',
      `Tem certeza que deseja excluir "${dieta?.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            hap.remove();
            await excluir(dietaId);
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={[styles.menu, { left, top }]}>
            <Pressable
              onPress={handleEditar}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={styles.itemText}>Editar dieta</Text>
            </Pressable>
            <View style={styles.sep} />
            <Pressable
              onPress={handleExcluir}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={[styles.itemText, styles.danger]}>Excluir dieta</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <NovaDietaModal
        visible={editando}
        modo="editar"
        dietaId={dietaId}
        onClose={() => setEditando(false)}
      />
    </>
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
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
