import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/colors';
import { Button } from '@/components/ui/Button';
import { useCanAdvance, useWizardStep } from '../stores/useTdeeWizardStore';

interface Props {
  /** Loading do botão principal (enquanto salva os targets no step final). */
  loading?: boolean;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Footer ancorado do wizard.
 *
 * Layout:
 *  - Steps 2–4: [ Voltar ] [ Botão principal (flex) ]
 *  - Step 1: [ Botão principal (largura total) ] (sem "Voltar")
 *
 * Botão principal:
 *  - Steps 1–3: "Continuar", desabilitado se !canAdvance
 *  - Step 4: "Aplicar meta", com loading enquanto salva
 *
 * Componente controlado — recebe tudo por props, não lê store.
 */
export function WizardFooter({
  loading = false,
  onBack,
  onNext,
}: Props) {
  const insets = useSafeAreaInsets();
  const step = useWizardStep();
  const canAdvance = useCanAdvance();

  const isLastStep = step === 4;
  const showBack = step > 1;

  const mainLabel = isLastStep ? 'Aplicar meta' : 'Continuar';
  // No último step o gating de validação não se aplica (já passou pelos anteriores);
  // só o loading pode bloquear. Nos steps 1–3, canAdvance controla.
  const mainDisabled = isLastStep ? loading : !canAdvance;
  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
    >
      {showBack && (
        <View style={styles.backSlot}>
          <Button variant="secondary" onPress={onBack} disabled={loading}>
            Voltar
          </Button>
        </View>
      )}

      <View style={styles.mainSlot}>
        <Button
          variant="primary"
          onPress={onNext}
          disabled={mainDisabled}
          loading={loading}
        >
          {mainLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  backSlot: {
    // largura natural — "Voltar" não expande
    flexShrink: 0,
  },
  mainSlot: {
    flex: 1,
  },
});