import { memo, useState, useRef } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import { useDieta } from '@/stores/useDietasStore';
import { DietaActionsMenu } from './DietaActionsMenu';
import { hap } from '@/utils/haptics';

const APressable = Animated.createAnimatedComponent(Pressable);

interface Props { id: string }

function DietaListItemBase({ id }: Props) {
  const dieta = useDieta(id);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<View>(null);
  const [anchorPos, setAnchorPos] = useState<{ x: number; y: number } | null>(null);

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!dieta) return null;

  const abrir = () => {
    hap.tap();
    router.push(`/dieta/${id}` as any);
  };

  const abrirMenu = () => {
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setAnchorPos({ x: x + w, y: y + h });
      setMenuOpen(true);
      hap.tap();
    });
  };

  return (
    <>
      <View style={styles.cardWrap}>
        <APressable
          onPress={abrir}
          onPressIn={() => {
            scale.value = withTiming(0.97, { duration: 120, easing: Easing.out(Easing.quad) });
          }}
          onPressOut={() => {
            scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
          }}
          style={[styles.cardPressable, cardStyle]}
        >
          <View style={styles.info}>
            <Text style={styles.nome} numberOfLines={1}>{dieta.nome}</Text>
            <Text style={styles.tipo} numberOfLines={1}>{dieta.tipo}</Text>
          </View>
          <View style={styles.menuSpacer} pointerEvents="none" />
        </APressable>

        <Pressable
          ref={anchorRef}
          onPress={abrirMenu}
          hitSlop={14}
          style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
          accessibilityLabel="Mais opções"
        >
          <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      <DietaActionsMenu
        visible={menuOpen}
        anchor={anchorPos}
        dietaId={id}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}

export const DietaListItem = memo(DietaListItemBase);

const MENU_BTN_SIZE = 36;

const styles = StyleSheet.create({
  cardWrap: { position: 'relative' },
  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.cardPadH,
    paddingVertical: spacing.cardPadV + 2,
    minHeight: 72,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  info: { flex: 1, gap: 3 },
  nome: { fontSize: 17, fontWeight: '600', color: colors.text, letterSpacing: -0.2 },
  tipo: { fontSize: 13, color: colors.textSecondary, fontWeight: '400' },
  menuSpacer: { width: MENU_BTN_SIZE, height: MENU_BTN_SIZE },
  menuBtn: {
    position: 'absolute',
    right: spacing.cardPadH - 6,
    top: '50%',
    marginTop: -(MENU_BTN_SIZE / 2),
    width: MENU_BTN_SIZE,
    height: MENU_BTN_SIZE,
    borderRadius: MENU_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  menuBtnPressed: { backgroundColor: colors.surfaceAlt },
});
