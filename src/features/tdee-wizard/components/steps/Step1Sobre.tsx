import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';
import { SexoToggle } from '../inputs/SexoToggle';
import { NumberFieldPro } from '../inputs/NumberFieldPro';
import { useWizardDraft, useWizardActions } from '../../stores/useTdeeWizardStore';

const IDADE_RANGE = [14, 100] as const;

export function Step1Sobre() {
  const draft = useWizardDraft();
  const { setSex, setAge } = useWizardActions();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headline}>
        <Text style={styles.title}>Vamos calcular sua meta</Text>
        <Text style={styles.subtitle}>
          Comece com algumas informações sobre você
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>SEXO</Text>
        <SexoToggle value={draft.sex} onChange={setSex} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>IDADE</Text>
        <NumberFieldPro
          value={draft.age}
          onChange={setAge}
          suffix="anos"
          range={IDADE_RANGE}
          integer
          placeholder="0"
          accessibilityLabel="Idade"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  headline: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
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