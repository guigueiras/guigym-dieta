import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';

interface Props {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function SheetTabs({ tabs, activeIndex, onChange }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab, i) => (
        <Pressable key={tab} onPress={() => onChange(i)} style={styles.tab}
          accessibilityRole="tab" accessibilityState={{ selected: activeIndex === i }}>
          <Text style={[styles.label, activeIndex === i && styles.labelActive]}>{tab}</Text>
          {activeIndex === i && <View style={styles.indicator} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 2, position: 'relative' },
  label: { fontSize: 14, fontWeight: '600', color: colors.textMuted, letterSpacing: -0.2 },
  labelActive: { color: colors.primary },
  indicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 1, backgroundColor: colors.primary },
});
