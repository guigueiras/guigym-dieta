import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard, Modal, Pressable } from 'react-native';
import { Target, Pencil, Trash2 } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { useDietasActions, useDieta } from '@/stores/useDietasStore';
import { useUserProfileActions } from '@/stores/useUserProfileStore';
import { hap } from '@/utils/haptics';
import type { DietTargets, DuracaoConfig } from '@/types';
import type { UserProfile } from '@/types/userProfile';
import { WizardContainer } from '@/features/tdee-wizard/components/WizardContainer';

interface Props {
  visible: boolean;
  onClose: () => void;
  modo?: 'criar' | 'editar';
  dietaId?: string;
}

type DuracaoTipo = 'indefinida' | 'semanas' | 'dias';

const DURACAO_OPCOES: { tipo: DuracaoTipo; label: string }[] = [
  { tipo: 'indefinida', label: 'Indefinida' },
  { tipo: 'semanas',   label: 'Semanas' },
  { tipo: 'dias',      label: 'Dias' },
];

function buildDuracao(tipo: DuracaoTipo, qtdStr: string): DuracaoConfig {
  if (tipo === 'indefinida') return { tipo: 'indefinida' };
  const quantidade = Math.max(1, Math.min(tipo === 'semanas' ? 52 : 365, parseInt(qtdStr, 10) || 1));
  return { tipo, quantidade, diaInicio: null };
}

/**
 * Modal de criação/edição de dieta.
 */
export function NovaDietaModal({ visible, onClose, modo = 'criar', dietaId }: Props) {
  const dietaExistente = useDieta(dietaId);
  const { criar, renomear, setTargets } = useDietasActions();
  const { save: saveProfile } = useUserProfileActions();

  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const qtdRef = useRef<TextInput>(null);

  // Duração (só modo criar)
  const [duracaoTipo, setDuracaoTipo] = useState<DuracaoTipo>('indefinida');
  const [duracaoQtd, setDuracaoQtd] = useState('4');

  // Meta em limbo (modo criar)
  const [pendingTargets, setPendingTargets] = useState<DietTargets | null>(null);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTransition, setWizardTransition] = useState(false);

  const targetsExibidos: DietTargets | null =
    modo === 'editar'
      ? dietaExistente?.targets ?? null
      : pendingTargets;

  useEffect(() => {
    if (!visible) return;
    if (modo === 'editar' && dietaExistente) {
      setNome(dietaExistente.nome);
    } else {
      setNome('');
    }
    setDuracaoTipo('indefinida');
    setDuracaoQtd('4');
    setPendingTargets(null);
    setPendingProfile(null);
    setWizardOpen(false);
    setWizardTransition(false);
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const podeConfirmar = nome.trim().length > 0 && !salvando;

  // ─── Wizard ────────────────────────────────────────────────

  const handleAbrirWizard = () => {
    hap.tap();
    Keyboard.dismiss();
    setWizardTransition(true);
    setTimeout(() => {
      setWizardOpen(true);
      setWizardTransition(false);
    }, 320);
  };

  const handleResultadoPreCalculo = (data: { targets: DietTargets; profile: UserProfile }) => {
    setPendingTargets(data.targets);
    setPendingProfile(data.profile);
  };

  const handleFecharWizard = () => {
    setWizardOpen(false);
    setWizardTransition(true);
    setTimeout(() => setWizardTransition(false), 500);
  };

  const handleRemoverMeta = async () => {
    if (modo === 'criar') {
      hap.tap();
      setPendingTargets(null);
      setPendingProfile(null);
      return;
    }
    if (!dietaId) return;
    hap.tap();
    try {
      await setTargets(dietaId, null);
    } catch {
      hap.error();
    }
  };

  // ─── Confirmar ─────────────────────────────────────────────

  const confirmar = async () => {
    if (!podeConfirmar) return;
    Keyboard.dismiss();
    setSalvando(true);

    try {
      if (modo === 'editar' && dietaId) {
        await renomear(dietaId, nome.trim());
      } else {
        const duracao = buildDuracao(duracaoTipo, duracaoQtd);
        await criar(nome.trim(), duracao, pendingTargets ?? undefined);
        if (pendingProfile) {
          try { await saveProfile(pendingProfile); }
          catch (e) { console.warn('[NovaDietaModal] Falha ao salvar perfil:', e); }
        }
      }
      hap.add();
      onClose();
    } catch {
      hap.error();
    } finally {
      setSalvando(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <>
      <ResponsiveModal
        visible={visible && !wizardOpen && !wizardTransition}
        onClose={onClose}
        title={modo === 'editar' ? 'Editar Dieta' : 'Nova Dieta'}
        footerActions={
          <>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" onPress={onClose}>Cancelar</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                disabled={!podeConfirmar}
                loading={salvando}
                onPress={confirmar}
              >
                {modo === 'editar' ? 'Salvar' : 'Criar dieta'}
              </Button>
            </View>
          </>
        }
      >
        {/* Nome */}
        <View style={styles.field}>
          <Text style={styles.label}>Nome da dieta</Text>
          <TextInput
            ref={inputRef}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Bulking 2026"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={confirmar}
            blurOnSubmit
            maxLength={60}
            autoCapitalize="sentences"
          />
        </View>

        {/* Duração (só modo criar) */}
        {modo === 'criar' && (
          <View style={styles.field}>
            <Text style={styles.label}>Duração</Text>
            <View style={styles.duracaoRow}>
              {DURACAO_OPCOES.map(({ tipo, label }) => {
                const ativo = duracaoTipo === tipo;
                return (
                  <Pressable
                    key={tipo}
                    onPress={() => {
                      hap.select();
                      setDuracaoTipo(tipo);
                      if (tipo !== 'indefinida') {
                        setTimeout(() => qtdRef.current?.focus(), 50);
                      }
                    }}
                    style={[styles.duracaoChip, ativo && styles.duracaoChipAtivo]}
                  >
                    <Text style={[styles.duracaoChipText, ativo && styles.duracaoChipTextAtivo]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {duracaoTipo !== 'indefinida' && (
              <View style={styles.qtdRow}>
                <TextInput
                  ref={qtdRef}
                  value={duracaoQtd}
                  onChangeText={(v) => {
                    const num = v.replace(/[^0-9]/g, '');
                    setDuracaoQtd(num);
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  style={styles.qtdInput}
                  maxLength={3}
                  selectTextOnFocus
                />
                <Text style={styles.qtdSufixo}>
                  {duracaoTipo === 'semanas' ? 'semana(s)' : 'dia(s)'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Meta nutricional */}
        <View style={styles.field}>
          <Text style={styles.label}>Meta nutricional (opcional)</Text>
          <MetaBlock
            targets={targetsExibidos}
            onAbrirWizard={handleAbrirWizard}
            onRemover={handleRemoverMeta}
          />
        </View>
      </ResponsiveModal>

      <Modal
        visible={wizardOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleFecharWizard}
      >
        {modo === 'criar' ? (
          <WizardContainer
            onResult={handleResultadoPreCalculo}
            initialTargets={pendingTargets ?? undefined}
            onDone={handleFecharWizard}
          />
        ) : (
          <WizardContainer
            dietaId={dietaId}
            initialTargets={dietaExistente?.targets}
            onDone={handleFecharWizard}
          />
        )}
      </Modal>
    </>
  );
}

// ─── MetaBlock ────────────────────────────────────────────────

interface MetaBlockProps {
  targets: DietTargets | null;
  onAbrirWizard: () => void;
  onRemover: () => void;
}

function MetaBlock({ targets, onAbrirWizard, onRemover }: MetaBlockProps) {
  if (!targets) {
    return (
      <Button
        variant="secondary"
        onPress={onAbrirWizard}
        icon={<Target size={18} color={colors.primary} strokeWidth={2.2} />}
      >
        Definir meta nutricional
      </Button>
    );
  }

  return (
    <View style={styles.metaCard}>
      <View style={styles.metaHeader}>
        <Text style={styles.metaCalorias}>{Math.round(targets.calories)} kcal</Text>
      </View>
      <Text style={styles.metaMacros}>
        P {Math.round(targets.proteinG)}g · C {Math.round(targets.carbG)}g · G {Math.round(targets.fatG)}g
      </Text>
      <View style={styles.metaActions}>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            size="md"
            onPress={onAbrirWizard}
            icon={<Pencil size={14} color={colors.text} strokeWidth={2.2} />}
          >
            Editar
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            variant="ghost"
            size="md"
            onPress={onRemover}
            icon={<Trash2 size={14} color={colors.danger} strokeWidth={2.2} />}
          >
            Remover
          </Button>
        </View>
      </View>
    </View>
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

  // Duração
  duracaoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  duracaoChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  duracaoChipAtivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  duracaoChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  duracaoChipTextAtivo: {
    color: colors.primaryText,
  },
  qtdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  qtdInput: {
    width: 72,
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  qtdSufixo: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Meta
  metaCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  metaCalorias: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.4,
  },
  metaMacros: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  metaActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
