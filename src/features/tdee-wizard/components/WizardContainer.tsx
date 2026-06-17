import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { WizardProgress } from './WizardProgress';
import { WizardFooter } from './WizardFooter';
import { Step1Sobre } from './steps/Step1Sobre';
import { Step2Corpo } from './steps/Step2Corpo';
import { Step3Rotina } from './steps/Step3Rotina';
import { Step4Resultado } from './steps/Step4Resultado';
import {
  useTdeeWizardStore,
  useWizardStep,
  useWizardActions,
} from '../stores/useTdeeWizardStore';
import { useDietasActions } from '@/stores/useDietasStore';
import { fromMacroTargets } from '@/types/dieta';
import type { DietTargets } from '@/types/dieta';
import type { UserProfile } from '@/types/userProfile';
import { useUserProfileActions } from '@/stores/useUserProfileStore';
import { hap } from '@/utils/haptics';

const TOTAL_STEPS = 4;

const STEP_TITLES: Record<number, string> = {
  1: 'Sobre você',
  2: 'Seu corpo',
  3: 'Sua rotina',
  4: 'Seu objetivo',
};

interface Props {
  /**
   * Modo "aplicar em dieta existente": dietaId presente.
   * Wizard grava targets na dieta + salva profile imediatamente,
   * depois fecha. Comportamento legado.
   *
   * Modo "pré-cálculo": dietaId undefined.
   * Wizard calcula, devolve targets + profile via onResult, fecha.
   * Caller (NovaDietaModal) decide quando persistir.
   */
  dietaId?: string;

  /**
   * Callback do modo pré-cálculo: recebe targets + profile calculados.
   * Chamado ANTES do onDone, antes do reset. Caller é responsável
   * por guardar os dados e persistir quando apropriado.
   *
   * Ignorado se dietaId estiver presente (modo aplicar-em-dieta).
   */
  onResult?: (data: { targets: DietTargets; profile: UserProfile }) => void;

  /**
   * Targets pré-existentes (modo edição). Quando presentes, o wizard
   * inicializa o step 4 com goal/carbProfile correspondentes em vez
   * dos defaults (maintenance/medium_carb).
   *
   * O perfil (sex/age/peso/altura/atividade) continua vindo de
   * useUserProfileStore — esta prop afeta SOMENTE o step 4.
   */
  initialTargets?: DietTargets;

  /** Chamado pra fechar a rota/modal (após aplicar/devolver/descartar). */
  onDone: () => void;
}

export function WizardContainer({
  dietaId,
  onResult,
  initialTargets,
  onDone,
}: Props) {
  const insets = useSafeAreaInsets();
  const step = useWizardStep();
  const {
    nextStep, prevStep, reset,
    setSelection,
  } = useWizardActions();
  const { setTargets } = useDietasActions();
  const { save: saveProfile } = useUserProfileActions();

  const [saving, setSaving] = useState(false);

  // True se está no modo pré-cálculo (sem dieta destino).
  // Determina se persiste localmente (false) ou devolve via callback (true).
  const isPrecalculo = dietaId === undefined;

  // ─── Inicialização ao montar ─────────────────────────────────
  // Draft começa sempre vazio. Se houver initialTargets, restaura a
  // seleção de goal/carbProfile do step 4.
  useEffect(() => {
    if (initialTargets) {
      setSelection(initialTargets.goal, initialTargets.carbProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLastStep = step === TOTAL_STEPS;

  // ─── Fechar (com confirmação se há dados) ──────────────────
  const hasAnyData = useCallback(() => {
    const d = useTdeeWizardStore.getState().draft;
    return (
      d.sex !== null ||
      d.age !== null ||
      d.weightKg !== null ||
      d.heightCm !== null ||
      d.activityLevel !== null
    );
  }, []);

  const handleClose = useCallback(() => {
    const fechar = () => {
      reset();
      onDone();
    };
    if (hasAnyData()) {
      Alert.alert(
        'Descartar cálculo?',
        'Os dados preenchidos serão perdidos.',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: fechar },
        ]
      );
    } else {
      fechar();
    }
  }, [hasAnyData, reset, onDone]);

  // ─── Aplicar meta (step 4) ─────────────────────────────────
  // Comportamento depende do modo:
  //  - dietaId presente: grava targets na dieta + salva profile.
  //  - dietaId undefined (pré-cálculo): devolve via onResult, sem persistir.
  const aplicarMeta = useCallback(async () => {
    const state = useTdeeWizardStore.getState();
    const { result, selectedGoal, selectedCarbProfile } = state;
    if (result === null) return;

    const escolhido = result[selectedGoal][selectedCarbProfile];
    const targets = fromMacroTargets(escolhido);

    // UserProfile a partir do draft. Como chegamos aqui, é válido por construção
    // (step 4 só calcula se buildUserStats retornou completo).
    const profileToSave = state.buildUserStats();

    // ─── Modo pré-cálculo: devolve e fecha ───
    if (isPrecalculo) {
      if (profileToSave && onResult) {
        onResult({ targets, profile: profileToSave });
      }
      hap.add();
      reset();
      onDone();
      return;
    }

    // ─── Modo aplicar em dieta existente ───
    // dietaId garantido como string aqui (isPrecalculo === false).
    setSaving(true);
    try {
      // 1) Aplica targets na dieta (operação primária)
      await setTargets(dietaId as string, targets);

      // 2) Salva perfil (benefício secundário — falha não invalida a meta)
      if (profileToSave) {
        try {
          await saveProfile(profileToSave);
        } catch (profileErr) {
          console.warn('[WizardContainer] Falha ao salvar perfil:', profileErr);
        }
      }

      hap.add();
      reset();
      onDone();
    } catch {
      hap.error();
      Alert.alert('Erro', 'Não foi possível aplicar a meta. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }, [dietaId, isPrecalculo, onResult, setTargets, reset, onDone, saveProfile]);

  // ─── Avançar ───────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (isLastStep) {
      aplicarMeta();
    } else {
      nextStep();
    }
  }, [isLastStep, aplicarMeta, nextStep]);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, spacing.md) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          accessibilityLabel="Fechar calculadora"
        >
          <X size={22} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {STEP_TITLES[step] ?? ''}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <WizardProgress total={TOTAL_STEPS} current={step} />
      </View>

      {/* Conteúdo do step (com keyboard avoidance) */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Animated.View key={step} entering={FadeIn.duration(220)} style={styles.stepArea}>
          {step === 1 ? (
            <Step1Sobre />
          ) : step === 2 ? (
            <Step2Corpo />
          ) : step === 3 ? (
            <Step3Rotina />
          ) : (
            <Step4Resultado />
          )}
        </Animated.View>

        <WizardFooter
          loading={saving}
          onBack={prevStep}
          onNext={handleNext}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -6,
  },
  closeBtnPressed: { backgroundColor: colors.surfaceAlt },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 36 },
  progressWrap: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  stepArea: { flex: 1 },
});