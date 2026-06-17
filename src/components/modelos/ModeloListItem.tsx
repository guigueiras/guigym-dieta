import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';

import { useModelo, useModelosActions } from '@/stores/useModelosRefeicaoStore';
import { NovoModeloModal } from './NovoModeloModal';
import { colors, spacing } from '@/theme/colors';

interface Props {
  id: string;
}

export function ModeloListItem({ id }: Props) {
  const modelo = useModelo(id);
  const { excluir } = useModelosActions();
  const router = useRouter();
  const [renomearVisible, setRenomearVisible] = useState(false);

  if (!modelo) return null;

  const count = modelo.alimentos.length;

  function handleOptions() {
    Alert.alert(modelo!.nome, undefined, [
      {
        text: 'Renomear',
        onPress: () => setRenomearVisible(true),
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Excluir modelo',
            `Remover "${modelo!.nome}"? Esta ação não pode ser desfeita.`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: () => excluir(id) },
            ]
          );
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <>
      <View style={styles.cardWrap}>
        <Pressable
          onPress={() => router.push({ pathname: '/modelo/[id]', params: { id } })}
          style={styles.card}
        >
          <View style={styles.info}>
            <Text style={styles.nome} numberOfLines={1}>{modelo.nome}</Text>
            <Text style={styles.sub}>
              {count === 0 ? 'Sem alimentos' : count === 1 ? '1 alimento' : `${count} alimentos`}
            </Text>
          </View>
          <View style={styles.menuSpacer} pointerEvents="none" />
        </Pressable>

        <Pressable
          onPress={handleOptions}
          hitSlop={14}
          style={({ pressed }) => [styles.moreBtn, pressed && styles.moreBtnPressed]}
        >
          <MoreHorizontal size={20} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      <NovoModeloModal
        visible={renomearVisible}
        onClose={() => setRenomearVisible(false)}
        modeloId={id}
        nomeInicial={modelo.nome}
      />
    </>
  );
}

const MENU_BTN_SIZE = 36;

const styles = StyleSheet.create({
  cardWrap: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  card: {
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
  info: {
    flex: 1,
    gap: 3,
  },
  nome: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  menuSpacer: {
    width: MENU_BTN_SIZE,
    height: MENU_BTN_SIZE,
  },
  moreBtn: {
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
  moreBtnPressed: {
    backgroundColor: colors.surfaceAlt,
  },
});
