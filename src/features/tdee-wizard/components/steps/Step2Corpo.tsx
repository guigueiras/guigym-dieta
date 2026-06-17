import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';
import { VALIDATION_RANGES } from '@/utils/tdee';
import { NumberFieldPro } from '../inputs/NumberFieldPro';
import { useWizardDraft, useWizardActions } from '../../stores/useTdeeWizardStore';

export function Step2Corpo() {
  const draft = useWizardDraft();
  const { setWeight, setHeight, setBodyFat } = useWizardActions();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.field}>
        <Text style={styles.label}>PESO</Text>
        <NumberFieldPro
          value={draft.weightKg}
          onChange={setWeight}
          suffix="kg"
          range={VALIDATION_RANGES.weightKg}
          placeholder="0"
          autoFocus
          accessibilityLabel="Peso em quilos"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>ALTURA</Text>
        <NumberFieldPro
          value={draft.heightCm}
          onChange={setHeight}
          suffix="cm"
          range={VALIDATION_RANGES.heightCm}
          integer
          placeholder="0"
          accessibilityLabel="Altura em centímetros"
        />
      </View>

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>GORDURA CORPORAL</Text>
          <Text style={styles.labelOpcional}>OPCIONAL</Text>
        </View>
        <NumberFieldPro
          value={draft.bodyFatPct}
          onChange={setBodyFat}
          suffix="%"
          range={VALIDATION_RANGES.bodyFatPct}
          placeholder="—"
          accessibilityLabel="Percentual de gordura corporal"
        />
        <Text style={styles.hint}>
          Se souber sua composição corporal (ex: bioimpedância ou DEXA), informe aqui.
          O cálculo usará Katch-McArdle e a proteína será baseada na sua massa magra — mais preciso.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  field: { gap: spacing.sm },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  labelOpcional: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
