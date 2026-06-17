import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Keyboard, Alert,
} from 'react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { CategoriaSelect } from './CategoriaSelect';
import { UnidadeToggle } from './UnidadeToggle';
import { UnidadeHint } from './UnidadeHint';
import { MacroInput } from './MacroInput';
import { ConversaoCompraField } from './ConversaoCompraField';
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
  const [possuiFator, setPossuiFator] = useState<boolean>(false);
  const [fatorPreparo, setFatorPreparo] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const nomeRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    if (modo === 'editar' && alimento) {
      setNome(alimento.nome);
      setCategoria(alimento.categoria);
      setUnidade(alimento.unidade);
      setProteina(alimento.proteina);
      setCarbo(alimento.carbo);
      setGordura(alimento.gordura);
      setPossuiFator(alimento.possuiFator);
      setFatorPreparo(alimento.fatorPreparo);
    } else {
      setNome('');
      setCategoria(CATEGORIA_PADRAO);
      setUnidade('g');
      setProteina(null);
      setCarbo(null);
      setGordura(null);
      setPossuiFator(false);
      setFatorPreparo(null);
    }
    const t = setTimeout(() => nomeRef.current?.focus(), 280);
    return () => clearTimeout(t);
  }, [visible, modo, alimento]);

  const mostrarUnidade = categoria === 'frutas' || categoria === 'vegetais';

  useEffect(() => {
    if (!mostrarUnidade && unidade === 'un') setUnidade('g');
  }, [categoria]);

  const nomeValido = nome.trim().length >= 1;
  const macrosValidos = (proteina ?? 0) >= 0 && (carbo ?? 0) >= 0 && (gordura ?? 0) >= 0;
  const podeSalvar = nomeValido && macrosValidos && !salvando;

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
        possuiFator,
        fatorPreparo,
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
    <ResponsiveModal
      visible={visible}
      onClose={onClose}
      title={modo === 'editar' ? 'Editar Alimento' : 'Novo Alimento'}
      footerActions={
        <>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={onClose}>Cancelar</Button>
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
        </>
      }
    >
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
          <UnidadeToggle value={unidade} onChange={setUnidade} mostrarUnidade={mostrarUnidade} />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          {unidade === 'un' ? 'Macros por unidade (em gramas)' : 'Macros (sempre em gramas)'}
        </Text>
        <View style={styles.macrosRow}>
          <MacroInput label="PROTEÍNA (g)" value={proteina} onChange={setProteina} cor={colors.macroProtein} />
          <MacroInput label="CARBO (g)"    value={carbo}    onChange={setCarbo}    cor={colors.macroCarb} />
          <MacroInput label="GORDURA (g)"  value={gordura}  onChange={setGordura}  cor={colors.macroFat} />
        </View>
      </View>

      <UnidadeHint unidade={unidade} categoria={categoria} />

      <ConversaoCompraField
        unidade={unidade}
        possuiFator={possuiFator}
        fatorPreparo={fatorPreparo}
        onChange={(p, f) => { setPossuiFator(p); setFatorPreparo(f); }}
      />
    </ResponsiveModal>
  );
}

const styles = StyleSheet.create({
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
});
