import { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '@/theme/colors';
import { GoalSegmented } from '../inputs/GoalSegmented';
import { CarbProfileSegmented } from '../inputs/CarbProfileSegmented';
import { TargetCard } from '../results/TargetCard';
import {
  useWizardResult,
  useWizardSelection,
  useWizardActions,
} from '../../stores/useTdeeWizardStore';
import { useWizardCalculation } from '../../hooks/useWizardCalculation';

export function Step4Resultado() {
  const result = useWizardResult();
  const { goal, carbProfile } = useWizardSelection();
  const { setSelection, prevStep } = useWizardActions();
  const { calculate, getDeltaForGoal, error, idle } = useWizardCalculation();

  // Dispara cálculo uma única vez ao montar
  useEffect(() => {
    if (idle) {
      calculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Estado: erro ──────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Não foi possível calcular</Text>
        <Text style={styles.errorMsg}>{error.message}</Text>
        <Text style={styles.errorHint}>Verifique os dados nos steps anteriores</Text>
      </View>
    );
  }

  // ─── Estado: calculando ────────────────────────────────────
  if (result === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // ─── Estado: calculado ─────────────────────────────────────
  const target = result[goal][carbProfile];
  const delta = getDeltaForGoal(goal);
  if (!delta) {
    // edge case: result existe mas delta ainda não (deveria ser instantâneo)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.field}>
        <Text style={styles.label}>OBJETIVO</Text>
        <GoalSegmented
          value={goal}
          onChange={(g) => setSelection(g, carbProfile)}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>CARBOIDRATO</Text>
        <CarbProfileSegmented
          value={carbProfile}
          onChange={(cp) => setSelection(goal, cp)}
        />
      </View>

      <TargetCard target={target} delta={delta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});