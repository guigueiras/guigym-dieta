import { Text, StyleSheet, View } from 'react-native';

interface Props {
  label: string;
  valor: string;
  cor: string;
}

export function MacroChip({ label, valor, cor }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: cor }]}>{label}:</Text>
      <Text style={[styles.valor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  label: { fontSize: 12, fontWeight: '500', opacity: 0.85 },
  valor: { fontSize: 12, fontWeight: '700' },
});
