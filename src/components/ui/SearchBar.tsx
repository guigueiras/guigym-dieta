import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar...', editable = true }: Props) {
  return (
    <View style={[styles.wrap, !editable && styles.disabled]}>
      <Search size={18} color={colors.textMuted} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        returnKeyType="search"
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
});
