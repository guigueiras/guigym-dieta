import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard, Modal } from 'react-native';
import { Target, Pencil, Trash2 } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { useDietasActions, useDieta } from '@/stores/useDietasStore';
import { useUserProfileActions } from '@/stores/useUserProfileStore';
import { hap } from '@/utils/haptics';
import type { DietTargets } from '@/types';
import type { UserProfile } from '@/types/userProfile';
import { WizardContainer } from '@/features/tdee-wizard/components/WizardContainer';

interface Props {
  visible: boolean;
  onClose: () => void;
  modo?: 'criar' | 'editar';
  dietaId?: string;
}

/**
 * Modal de criação/edição de dieta.
 *
 * Fluxo (modo criar):
 *   1. Usuário digita o nome (obrigatório).
 *   2. Opcionalmente toca "Definir meta nutricional" → wizard sobe.
 *   3. Após "Aplicar meta" no wizard, retorna pro modal com targets+profile
 *      em memória (limbo — só persistem se a dieta for efetivamente criada).
 *   4. Toca "Criar dieta" → cria com nome+targets, salva profile.
 *   5. Cancelar (X ou Cancelar) descarta tudo, inclusive targets/profile.
 *
 * Fluxo (modo editar):
 *   1. Modal abre pré-preenchido com nome e meta (se houver) da dieta.
 *   2. Pode editar nome livremente.
 *   3. Tocar "Editar meta nutricional" abre wizard pré-preenchido com
 *      targets atuais — ao aplicar, atualiza a dieta diretamente.
 *   4. Pode remover a meta via botão "Remover meta" (sem confirmação extra).
 *   5. Tocar "Salvar" persiste só o nome (meta é gerenciada via wizard).
 *
 * Diferença-chave: no modo criar, a meta fica em limbo até "Criar dieta".
 * No modo editar, a meta é aplicada/removida imediatamente na dieta.
 */
export function NovaDietaModal({ visible, onClose, modo = 'criar', dietaId }: Props) {
  const dietaExistente = useDieta(dietaId);
  const { criar, renomear, setTargets } = useDietasActions();
  const { save: saveProfile } = useUserProfileActions();

  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Meta em limbo (modo criar). Ignorado no modo editar — a meta lá vem
  // direto da dieta via dietaExistente.targets.
  const [pendingTargets, setPendingTargets] = useState<DietTargets | null>(null);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  // Controla a visibilidade do wizard. Dois Modais nativos simultâneos
  // travam no iOS — usamos `wizardTransition` pra esperar a animação
  // de fechamento de um antes de abrir o outro.
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTransition, setWizardTransition] = useState(false);

  // No modo editar, os targets exibidos vêm da dieta. No modo criar, vêm do limbo.
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
    // Limpa o limbo a cada abertura — não persiste entre aberturas.
    setPendingTargets(null);
    setPendingProfile(null);
    setWizardOpen(false);
    setWizardTransition(false);
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]); // Intencional: captura nome/modo na abertura — não reage a mudanças de dietaExistente durante a sessão (causaria reset de wizardTransition enquanto o wizard ainda fecha)

  const podeConfirmar = nome.trim().length > 0 && !salvando;

  // ─── Ações do wizard ───────────────────────────────────────

  const handleAbrirWizard = () => {
    hap.tap();
    Keyboard.dismiss();
    // Fluxo de 2 passos pra evitar conflito de dois Modais simultâneos:
    //  1. Marca transição → ResponsiveModal começa a fechar (animação ~300ms)
    //  2. Após delay, abre o wizard
    setWizardTransition(true);
    setTimeout(() => {
      setWizardOpen(true);
      setWizardTransition(false);
    }, 320);
  };

  // Modo criar: recebe targets+profile do wizard pré-cálculo
  const handleResultadoPreCalculo = (data: {
    targets: DietTargets;
    profile: UserProfile;
  }) => {
    setPendingTargets(data.targets);
    setPendingProfile(data.profile);
  };

  const handleFecharWizard = () => {
    // Fluxo inverso de 2 passos: fecha o wizard, espera animação,
    // reabre o ResponsiveModal.
    // fullScreen+slide no iOS leva ~400-450ms — 500ms dá margem segura.
    setWizardOpen(false);
    setWizardTransition(true);
    setTimeout(() => {
      setWizardTransition(false);
    }, 500);
  };

  const handleRemoverMeta = async () => {
    if (modo === 'criar') {
      // Limbo: só apaga local
      hap.tap();
      setPendingTargets(null);
      setPendingProfile(null);
      return;
    }

    // Modo editar: persiste imediatamente
    if (!dietaId) return;
    hap.tap();
    try {
      await setTargets(dietaId, null);
    } catch {
      hap.error();
    }
  };

  // ─── Confirmar (criar/salvar) ───────────────────────────────

  const confirmar = async () => {
    if (!podeConfirmar) return;
    Keyboard.dismiss();
    setSalvando(true);

    try {
      if (modo === 'editar' && dietaId) {
        // Modo editar: só renomeia. Meta foi aplicada/removida diretamente
        // via setTargets (ações independentes acima).
        await renomear(dietaId, nome.trim());
      } else {
        // Modo criar: cria a dieta com nome + targets pendentes (se houver)
        await criar(nome.trim(), pendingTargets ?? undefined);

        // Salva o profile pendente (benefício secundário, não-fatal)
        if (pendingProfile) {
          try {
            await saveProfile(pendingProfile);
          } catch (profileErr) {
            console.warn('[NovaDietaModal] Falha ao salvar perfil:', profileErr);
          }
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

      {/* Wizard (sobreposto). Modo pré-cálculo (criar) ou aplicar (editar). */}
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

// ─── MetaBlock: componente do bloco de meta ──────────────────

interface MetaBlockProps {
  targets: DietTargets | null;
  onAbrirWizard: () => void;
  onRemover: () => void;
}

function MetaBlock({ targets, onAbrirWizard, onRemover }: MetaBlockProps) {
  if (!targets) {
    // Estado vazio: botão de chamada à ação
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

  // Estado preenchido: resumo + botões
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
