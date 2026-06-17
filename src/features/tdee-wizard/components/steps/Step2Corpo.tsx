import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';
import { VALIDATION_RANGES } from '@/utils/tdee';
import { NumberFieldPro } from '../inputs/NumberFieldPro';
import { useWizardDraft, useWizardActions } from '../../stores/useTdeeWizardStore';

export function Step2Corpo() {
  const draft = useWizardDraft();
  const { setWeight, setHeight } = useWizardActions();

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
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
});