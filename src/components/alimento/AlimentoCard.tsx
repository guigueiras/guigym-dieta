import { memo, useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Modal as RNModal, Dimensions } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import { useAlimento, useAlimentosActions } from '@/stores/useAlimentosStore';
import { resolveCategoria } from '@/constants/categorias';
import { hap } from '@/utils/haptics';

const APressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  id: string;
  onEditar: () => void;
}

function AlimentoCardBase({ id, onEditar }: Props) {
  const alimento = useAlimento(id);
  const { excluir, contarUsos } = useAlimentosActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<View>(null);
  const [anchorPos, setAnchorPos] = useState<{ x: number; y: number } | null>(null);

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!alimento) return null;

  const categoria = resolveCategoria(alimento.categoria);
  const Icon = categoria.icon;

  const abrirMenu = () => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setAnchorPos({ x: x + w, y: y + h });
      setMenuOpen(true);
      hap.tap();
    });
  };

  const handleExcluir = async () => {
    setMenuOpen(false);
    const usos = await contarUsos(id);
    if (usos.refeicoes > 0) {
      Alert.alert(
        'Não é possível excluir',
        `Este alimento está sendo usado em ${usos.refeicoes} ${usos.refeicoes === 1 ? 'refeição' : 'refeições'} ` +
        `(${usos.dietas} ${usos.dietas === 1 ? 'dieta' : 'dietas'}). ` +
        `Remova-o das dietas antes de excluir.`,
        [{ text: 'Entendi', style: 'default' }]
      );
      hap.warn();
      return;
    }
    Alert.alert(
      'Excluir alimento',
      `Tem certeza que deseja excluir "${alimento.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            hap.remove();
            await excluir(id);
          },
        },
      ]
    );
  };

  const handleEditar = () => {
    setMenuOpen(false);
    setTimeout(() => onEditar(), 50);
  };

  return (
    <>
      <View style={styles.cardWrap}>
        <APressable
          onPress={onEditar}
          onPressIn={() => {
            scale.value = withTiming(0.98, { duration: 120, easing: Easing.out(Easing.quad) });
          }}
          onPressOut={() => {
            scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
          }}
          style={[styles.cardPressable, cardStyle]}
        >
          <View style={styles.topRow}>
            <View style={styles.titleArea}>
              <Text style={styles.nome} numberOfLines={1}>{alimento.nome}</Text>
              <View style={styles.categoriaRow}>
                <Icon size={12} color={categoria.color} strokeWidth={2.4} />
                <Text style={styles.categoriaLabel}>{categoria.label}</Text>
              </View>
            </View>
            <View style={styles.menuSpacer} pointerEvents="none" />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>por 100{alimento.unidade}</Text>
          </View>

          <View style={styles.macrosRow}>
            <MacroBox label="Proteína" valor={`${alimento.proteina}g`} cor={colors.macroProtein} />
            <MacroBox label="Carbo"    valor={`${alimento.carbo}g`}    cor={colors.macroCarb} />
            <MacroBox label="Gordura"  valor={`${alimento.gordura}g`}  cor={colors.macroFat} />
          </View>
        </APressable>

        <Pressable
          ref={anchorRef}
          onPress={abrirMenu}
          hitSlop={14}
          accessibilityLabel="Mais opções"
          style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
        >
          <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      <AlimentoActionsMenu
        visible={menuOpen}
        anchor={anchorPos}
        onClose={() => setMenuOpen(false)}
        onEditar={handleEditar}
        onExcluir={handleExcluir}
      />
    </>
  );
}

export const AlimentoCard = memo(AlimentoCardBase);

function MacroBox({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <View style={mb.box}>
      <Text style={mb.label}>{label}</Text>
      <Text style={[mb.valor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

const mb = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  valor: { fontSize: 15, fontWeight: '700' },
});

interface MenuProps {
  visible: boolean;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}

function AlimentoActionsMenu({ visible, anchor, onClose, onEditar, onExcluir }: MenuProps) {
  const screen = Dimensions.get('window');
  const MENU_W = 180;
  const MENU_H = 92;
  const left = anchor ? Math.min(Math.max(8, anchor.x - MENU_W), screen.width - MENU_W - 8) : 0;
  const top = anchor ? Math.min(anchor.y + 4, screen.height - MENU_H - 8) : 0;

  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={menuStyles.backdrop} onPress={onClose}>
        <View style={[menuStyles.menu, { left, top }]}>
          <Pressable
            onPress={onEditar}
            style={({ pressed }) => [menuStyles.item, pressed && menuStyles.itemPressed]}
          >
            <Text style={menuStyles.itemText}>Editar alimento</Text>
          </Pressable>
          <View style={menuStyles.sep} />
          <Pressable
            onPress={onExcluir}
            style={({ pressed }) => [menuStyles.item, pressed && menuStyles.itemPressed]}
          >
            <Text style={[menuStyles.itemText, menuStyles.danger]}>Excluir alimento</Text>
          </Pressable>
        </View>
      </Pressable>
    </RNModal>
  );
}

const MENU_BTN_SIZE = 36;

const styles = StyleSheet.create({
  cardWrap: { position: 'relative' },
  cardPressable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg - 2,
    gap: spacing.sm + 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleArea: { flex: 1, gap: 4 },
  nome: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  categoriaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoriaLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  menuSpacer: { width: MENU_BTN_SIZE, height: MENU_BTN_SIZE },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: colors.primaryText, fontWeight: '700' },
  macrosRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  menuBtn: {
    position: 'absolute',
    top: spacing.lg - 2 - 8,
    right: spacing.lg - 6,
    width: MENU_BTN_SIZE,
    height: MENU_BTN_SIZE,
    borderRadius: MENU_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  menuBtnPressed: { backgroundColor: colors.surfaceAlt },
});

const menuStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.001)' },
  menu: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
