import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';
import { AtividadeSelect } from '../inputs/AtividadeSelect';
import { useWizardDraft, useWizardActions } from '../../stores/useTdeeWizardStore';

export function Step3Rotina() {
  const draft = useWizardDraft();
  const { setActivity } = useWizardActions();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.intro}>
        <Text style={styles.question}>Com que frequência você treina?</Text>
        <Text style={styles.hint}>
          Escolha a opção que mais se aproxima da sua semana atual
        </Text>
      </View>

      <AtividadeSelect value={draft.activityLevel} onChange={setActivity} />
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
  intro: {
    gap: spacing.xs,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});