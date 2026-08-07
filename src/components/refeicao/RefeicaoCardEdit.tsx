import { memo, useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { GripVertical, Plus, MoreVertical } from 'lucide-react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme/colors';
import {
  useEditRefeicao, useEditDietaStore,
} from '@/stores/useEditDietaStore';
import { useAlimentosStore } from '@/stores/useAlimentosStore';
import { useShallow } from 'zustand/react/shallow';
import { calcMacros, somarMacros } from '@/utils/macros';
import { MacrosBar } from './MacrosBar';
import { AlimentoLinhaEdit } from './AlimentoLinhaEdit';
import { EmptyRefeicao } from './EmptyRefeicao';
import { AnimatedListItem } from '@/components/ui/AnimatedListItem';
import { Highlight } from '@/components/ui/Highlight';
import { RefeicaoActionsMenu } from './RefeicaoActionsMenu';
import { RenomearRefeicaoModal } from './RenomearRefeicaoModal';
import { NovoModeloModal } from '@/components/modelos/NovoModeloModal';
import { useModelosActions } from '@/stores/useModelosRefeicaoStore';
import { hap } from '@/utils/haptics';
import type { DiaSemana } from '@/types';

interface Props {
  dia: DiaSemana;
  refeicaoId: string;
  isDragging: boolean;
  onLongPressDrag: () => void;
  onAdicionarAlimento: () => void;
  highlightAlimentoId?: string | null;
}

function RefeicaoCardEditBase({
  dia, refeicaoId, isDragging, onLongPressDrag, onAdicionarAlimento, highlightAlimentoId,
}: Props) {
  const ref = useEditRefeicao(dia, refeicaoId);
  const alimentosBase = useAlimentosStore(useShallow((s) => s.byId));

  // Quantidade de refeições no dia — pra decidir se "Excluir" fica habilitado.
  const totalRefeicoesDoDia = useEditDietaStore(
    (s) => s.dietaEditada?.semanas.find((sem) => sem.numero === s.semanaAtiva)?.dias.find((d) => d.nome === dia)?.refeicoes.length ?? 0
  );

  const { adicionarAlimento } = useModelosActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renomearOpen, setRenomearOpen] = useState(false);
  const [salvarModeloOpen, setSalvarModeloOpen] = useState(false);

  const handleModeloCriado = async (modeloId: string) => {
    if (!ref) return;
    for (const a of ref.alimentos) {
      await adicionarAlimento(modeloId, a.alimentoId);
    }
    hap.add();
  };
  const menuAnchorRef = useRef<View>(null);
  const [menuAnchorPos, setMenuAnchorPos] = useState<{ x: number; y: number } | null>(null);

  const totaisRefeicao = useMemo(() => {
    if (!ref) return { proteina: 0, carbo: 0, gordura: 0, calorias: 0 };
    const lista = ref.alimentos
      .map((a) => alimentosBase[a.alimentoId] ? calcMacros(alimentosBase[a.alimentoId], a.quantidade) : null)
      .filter(Boolean) as ReturnType<typeof calcMacros>[];
    return somarMacros(lista);
  }, [ref, alimentosBase]);

  const dragProgress = useSharedValue(0);

  useEffect(() => {
    if (isDragging) {
      hap.tap();
      dragProgress.value = withSpring(1, { damping: 18, stiffness: 240, mass: 0.7 });
    } else {
      dragProgress.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
    }
  }, [isDragging]);

  const cardAnimStyle = useAnimatedStyle(() => {
    const p = dragProgress.value;
    return {
      transform: [{ scale: 1 + p * 0.04 }],
      shadowOpacity: 0.05 + p * 0.18,
      shadowRadius: 8 + p * 16,
      shadowOffset: { width: 0, height: 2 + p * 8 },
      elevation: 1 + p * 12,
      borderColor: p > 0.5 ? colors.primary : colors.border,
      borderWidth: StyleSheet.hairlineWidth + p * 1,
    };
  });

  const handleAnimStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + dragProgress.value * 0.5,
    transform: [{ scale: 1 + dragProgress.value * 0.15 }],
  }));

  const abrirMenu = () => {
    menuAnchorRef.current?.measureInWindow((x, y, w, h) => {
      setMenuAnchorPos({ x: x + w, y: y + h });
      setMenuOpen(true);
      hap.tap();
    });
  };

  if (!ref) return null;
  const vazia = ref.alimentos.length === 0;
  const podeExcluir = totalRefeicoesDoDia > 1;

  return (
    <>
      <Animated.View style={[styles.card, cardAnimStyle]}>
        <View style={styles.headerRow}>
          <Pressable
            onLongPress={onLongPressDrag}
            delayLongPress={150}
            hitSlop={10}
            style={styles.dragHandle}
            accessibilityLabel="Arrastar para reordenar"
          >
            <Animated.View style={handleAnimStyle}>
              <GripVertical
                size={18}
                color={isDragging ? colors.primary : colors.textMuted}
                strokeWidth={2.2}
              />
            </Animated.View>
          </Pressable>

          <Text style={styles.titulo} numberOfLines={1}>{ref.nome}</Text>

          <Pressable
            ref={menuAnchorRef}
            onPress={abrirMenu}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            accessibilityLabel="Mais opções"
          >
            <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={onAdicionarAlimento}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPlusPressed]}
            accessibilityLabel="Adicionar alimento"
          >
            <Plus size={20} color={colors.primary} strokeWidth={2.4} />
          </Pressable>
        </View>

        {vazia ? (
          <EmptyRefeicao />
        ) : (
          <>
            <View style={styles.alimentos}>
              {ref.alimentos.map((a) => (
                <AnimatedListItem key={a.id}>
                  <Highlight highlightKey={highlightAlimentoId === a.id ? a.id : undefined}>
                    <AlimentoLinhaEdit
                      dia={dia}
                      refeicaoId={refeicaoId}
                      alimentoNaRefId={a.id}
                      alimentoId={a.alimentoId}
                      quantidade={a.quantidade}
                    />
                  </Highlight>
                </AnimatedListItem>
              ))}
            </View>
            <MacrosBar macros={totaisRefeicao} />
          </>
        )}
      </Animated.View>

      <RefeicaoActionsMenu
        visible={menuOpen}
        anchor={menuAnchorPos}
        dia={dia}
        refeicaoId={refeicaoId}
        refeicaoNome={ref.nome}
        podeExcluir={podeExcluir}
        onClose={() => setMenuOpen(false)}
        onRenomear={() => setRenomearOpen(true)}
        onSalvarComoModelo={() => setSalvarModeloOpen(true)}
      />

      <RenomearRefeicaoModal
        visible={renomearOpen}
        onClose={() => setRenomearOpen(false)}
        dia={dia}
        refeicaoId={refeicaoId}
      />

      <NovoModeloModal
        visible={salvarModeloOpen}
        onClose={() => setSalvarModeloOpen(false)}
        nomeInicial={ref?.nome}
        onSuccess={handleModeloCriado}
      />
    </>
  );
}

export const RefeicaoCardEdit = memo(RefeicaoCardEditBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dragHandle: { padding: 4, marginLeft: -4 },
  titulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginRight: 4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: { backgroundColor: colors.surfaceAlt },
  iconBtnPlusPressed: { backgroundColor: colors.primaryLight },
  alimentos: { gap: spacing.sm },
});